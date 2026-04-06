import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { db, hasRequiredFirebaseConfig, storage } from './firebase';

const SHOULD_UPLOAD_AUDIO_TO_STORAGE = Platform.OS === 'web';

const inferAudioExtension = (audioDataUrl) => {
  const normalized = String(audioDataUrl || '').toLowerCase();

  if (normalized.includes('audio/x-caf')) {
    return 'caf';
  }

  if (normalized.includes('audio/wav')) {
    return 'wav';
  }

  if (normalized.includes('audio/mpeg')) {
    return 'mp3';
  }

  if (normalized.includes('audio/ogg')) {
    return 'ogg';
  }

  return 'm4a';
};

const uploadAudioDataUrl = async ({ audioDataUrl, chatId, senderId }) => {
  const normalizedAudioDataUrl = String(audioDataUrl || '').trim();

  if (!normalizedAudioDataUrl) {
    return null;
  }

  if (!storage) {
    throw new Error('Storage do Firebase não configurado para envio de áudio.');
  }

  const extension = inferAudioExtension(normalizedAudioDataUrl);
  const filePath = `chat-audios/${chatId}/${Date.now()}-${String(senderId)}.${extension}`;
  const audioRef = ref(storage, filePath);

  await uploadString(audioRef, normalizedAudioDataUrl, 'data_url');
  return getDownloadURL(audioRef);
};

const uploadAudioFileUri = async ({ audioFileUri, audioMimeType, chatId, senderId }) => {
  const normalizedAudioUri = String(audioFileUri || '').trim();

  if (!normalizedAudioUri) {
    return null;
  }

  if (!storage) {
    throw new Error('Storage do Firebase não configurado para envio de áudio.');
  }

  const extension = inferAudioExtension(audioMimeType || normalizedAudioUri);
  const filePath = `chat-audios/${chatId}/${Date.now()}-${String(senderId)}.${extension}`;
  const audioRef = ref(storage, filePath);

  const base64Encoding = FileSystem?.EncodingType?.Base64 || 'base64';
  const audioBase64 = await FileSystem.readAsStringAsync(normalizedAudioUri, {
    encoding: base64Encoding,
  });

  if (!audioBase64) {
    throw new Error('Não foi possível ler o arquivo de áudio para upload.');
  }

  await uploadString(audioRef, audioBase64, 'base64', {
    contentType: audioMimeType || 'audio/m4a',
  });

  return getDownloadURL(audioRef);
};

const readAudioFileAsDataUrl = async ({ audioFileUri, audioMimeType }) => {
  const normalizedAudioUri = String(audioFileUri || '').trim();

  if (!normalizedAudioUri) {
    return null;
  }

  const base64Encoding = FileSystem?.EncodingType?.Base64 || 'base64';
  const audioBase64 = await FileSystem.readAsStringAsync(normalizedAudioUri, {
    encoding: base64Encoding,
  });

  if (!audioBase64) {
    return null;
  }

  const normalizedMime = String(audioMimeType || '').trim() || 'audio/m4a';
  return `data:${normalizedMime};base64,${audioBase64}`;
};

export const createGroupChat = async ({
  groupName,
  creatorId,
  creatorName,
  selectedUsers = [],
}) => {
  if (!hasRequiredFirebaseConfig || !db) {
    throw new Error('Firebase não configurado no app.');
  }

  const trimmedGroupName = String(groupName || '').trim();

  if (!trimmedGroupName) {
    throw new Error('Informe um nome para o grupo.');
  }

  const normalizedUsers = selectedUsers
    .filter((item) => Boolean(item?.id))
    .map((item) => ({
      id: String(item.id),
      name: item?.name || 'Usuário',
    }));

  const participants = [...new Set([String(creatorId), ...normalizedUsers.map((item) => item.id)])].sort();

  if (participants.length < 2) {
    throw new Error('Selecione pelo menos uma pessoa para criar o grupo.');
  }

  const participantNames = normalizedUsers.reduce(
    (accumulator, user) => ({
      ...accumulator,
      [user.id]: user.name,
    }),
    {
      [String(creatorId)]: creatorName || 'Você',
    },
  );

  const unreadCountByUser = participants.reduce(
    (accumulator, participantId) => ({
      ...accumulator,
      [participantId]: 0,
    }),
    {},
  );

  const lastReadAtByUser = {
    [String(creatorId)]: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'chats'), {
    isGroup: true,
    groupName: trimmedGroupName,
    participants,
    participantNames,
    unreadCountByUser,
    lastReadAtByUser,
    createdBy: String(creatorId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: 'Grupo criado',
    lastMessageSenderId: String(creatorId),
  });

  return {
    chatId: docRef.id,
    groupName: trimmedGroupName,
    participants,
  };
};

export const buildDirectChatId = (userAId, userBId) => {
  const a = String(userAId || '').trim();
  const b = String(userBId || '').trim();

  if (!a || !b) {
    return '';
  }

  return [a, b].sort().join('_');
};

const toMillis = (timestamp) => {
  if (!timestamp) {
    return 0;
  }

  if (typeof timestamp?.toMillis === 'function') {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  return 0;
};

export const subscribeToUserChats = (userId, onChats, onError) => {
  if (!hasRequiredFirebaseConfig || !db || !userId) {
    onChats([]);
    return () => {};
  }

  const chatsRef = collection(db, 'chats');
  const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats = snapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));

      onChats(chats);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
};

export const subscribeToMessages = (chatId, onMessages, onError) => {
  if (!hasRequiredFirebaseConfig || !db || !chatId) {
    onMessages([]);
    return () => {};
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));

      onMessages(messages);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
};

export const subscribeToChat = (chatId, onChat, onError) => {
  if (!hasRequiredFirebaseConfig || !db || !chatId) {
    onChat(null);
    return () => {};
  }

  const chatRef = doc(db, 'chats', chatId);

  return onSnapshot(
    chatRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChat(null);
        return;
      }

      onChat({ id: snapshot.id, ...snapshot.data() });
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
};

export const sendMessageToChat = async ({
  chatId,
  senderId,
  senderName,
  recipientId,
  recipientName,
  messageText,
  imageDataUrl,
  audioDataUrl,
  audioFileUri,
  audioMimeType,
  audioDurationMs,
}) => {
  if (!hasRequiredFirebaseConfig || !db) {
    throw new Error('Firebase não configurado no app.');
  }

  const trimmedMessage = String(messageText || '').trim();
  const normalizedImageDataUrl = String(imageDataUrl || '').trim();
  const normalizedAudioDataUrl = String(audioDataUrl || '').trim();
  const normalizedAudioFileUri = String(audioFileUri || '').trim();
  const hasText = Boolean(trimmedMessage);
  const hasImage = Boolean(normalizedImageDataUrl);
  const hasAudio = Boolean(normalizedAudioDataUrl || normalizedAudioFileUri);

  if ((!hasText && !hasImage && !hasAudio) || !chatId || !senderId) {
    return;
  }

  const senderIdAsString = String(senderId);
  const recipientIdAsString = recipientId ? String(recipientId) : null;

  const chatRef = doc(db, 'chats', chatId);
  const chatSnapshot = await getDoc(chatRef);
  const existingChat = chatSnapshot.exists() ? chatSnapshot.data() : null;

  const existingParticipants = Array.isArray(existingChat?.participants)
    ? existingChat.participants.map((item) => String(item))
    : [];

  const participants = existingParticipants.length
    ? [...new Set(existingParticipants)]
    : [...new Set([senderIdAsString, recipientIdAsString].filter(Boolean))].sort();

  const existingParticipantNames = existingChat?.participantNames || {};
  const participantNames = {
    ...existingParticipantNames,
    [senderIdAsString]: senderName || existingParticipantNames?.[senderIdAsString] || 'Você',
    ...(recipientIdAsString
      ? {
        [recipientIdAsString]:
            recipientName
            || existingParticipantNames?.[recipientIdAsString]
            || 'Usuário',
      }
      : {}),
  };

  const unreadUpdates = participants.reduce((accumulator, participant) => {
    if (participant === senderIdAsString) {
      accumulator[`unreadCountByUser.${participant}`] = 0;
      return accumulator;
    }

    accumulator[`unreadCountByUser.${participant}`] = increment(1);
    return accumulator;
  }, {});

  await setDoc(
    chatRef,
    {
      participants,
      participantNames,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  let finalAudioUrl = null;

  if (hasAudio) {
    if (!SHOULD_UPLOAD_AUDIO_TO_STORAGE) {
      if (normalizedAudioFileUri) {
        finalAudioUrl = await readAudioFileAsDataUrl({
          audioFileUri: normalizedAudioFileUri,
          audioMimeType,
        });
      }

      if (!finalAudioUrl && normalizedAudioDataUrl) {
        finalAudioUrl = normalizedAudioDataUrl;
      }

      if (!finalAudioUrl) {
        throw new Error('Não foi possível preparar o áudio para envio.');
      }
    } else {
    try {
      if (normalizedAudioFileUri) {
        finalAudioUrl = await uploadAudioFileUri({
          audioFileUri: normalizedAudioFileUri,
          audioMimeType,
          chatId,
          senderId: senderIdAsString,
        });
      } else {
        finalAudioUrl = await uploadAudioDataUrl({
          audioDataUrl: normalizedAudioDataUrl,
          chatId,
          senderId: senderIdAsString,
        });
      }
    } catch (error) {
      if (normalizedAudioFileUri) {
        const fallbackDataUrl = await readAudioFileAsDataUrl({
          audioFileUri: normalizedAudioFileUri,
          audioMimeType,
        });

        if (fallbackDataUrl) {
          finalAudioUrl = await uploadAudioDataUrl({
            audioDataUrl: fallbackDataUrl,
            chatId,
            senderId: senderIdAsString,
          });
        }
      }

      if (!finalAudioUrl && normalizedAudioDataUrl) {
        finalAudioUrl = await uploadAudioDataUrl({
          audioDataUrl: normalizedAudioDataUrl,
          chatId,
          senderId: senderIdAsString,
        });
      }

      if (!finalAudioUrl) {
        const details = [error?.code, error?.message].filter(Boolean).join(' - ');
        throw new Error(details || 'Falha ao enviar áudio para o storage.');
      }
    }
    }
  }

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: hasText ? trimmedMessage : '',
    imageUrl: hasImage ? normalizedImageDataUrl : null,
    audioUrl: hasAudio ? finalAudioUrl : null,
    audioDurationMs: hasAudio ? Number(audioDurationMs || 0) : 0,
    type: hasImage ? 'image' : hasAudio ? 'audio' : 'text',
    senderId,
    senderName: senderName || 'Você',
    createdAt: serverTimestamp(),
  });

  const lastMessageLabel = hasAudio
    ? '🎤 Áudio'
    : hasImage
    ? (hasText ? `📷 ${trimmedMessage}` : '📷 Imagem')
    : trimmedMessage;

  await updateDoc(chatRef, {
    lastMessage: lastMessageLabel,
    lastMessageSenderId: senderIdAsString,
    updatedAt: serverTimestamp(),
    ...unreadUpdates,
  });
};

export const markChatAsRead = async (chatId, userId) => {
  if (!hasRequiredFirebaseConfig || !db || !chatId || !userId) {
    return;
  }

  const chatRef = doc(db, 'chats', chatId);

  try {
    await updateDoc(chatRef, {
      [`unreadCountByUser.${userId}`]: 0,
      [`lastReadAtByUser.${userId}`]: serverTimestamp(),
    });
  } catch {
    await setDoc(
      chatRef,
      {
        participants: [String(userId)],
        unreadCountByUser: {
          [userId]: 0,
        },
        lastReadAtByUser: {
          [userId]: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
};

export const setTypingStatus = async ({
  chatId,
  userId,
  isTyping,
  participantId,
  userName,
  participantName,
}) => {
  if (!hasRequiredFirebaseConfig || !db || !chatId || !userId) {
    return;
  }

  const userIdAsString = String(userId);
  const payload = {
    createdAt: serverTimestamp(),
    typingByUser: {
      [userIdAsString]: Boolean(isTyping),
    },
    typingUpdatedAtByUser: {
      [userIdAsString]: serverTimestamp(),
    },
  };

  if (participantId) {
    payload.participants = [userIdAsString, String(participantId)].filter(Boolean);
    payload.participantNames = {
      [userIdAsString]: userName || 'Você',
      [String(participantId)]: participantName || 'Usuário',
    };
  }

  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    payload,
    { merge: true },
  );
};
