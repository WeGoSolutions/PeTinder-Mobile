import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, hasRequiredFirebaseConfig } from './firebase';

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
}) => {
  if (!hasRequiredFirebaseConfig || !db) {
    throw new Error('Firebase não configurado no app.');
  }

  const trimmedMessage = String(messageText || '').trim();

  if (!trimmedMessage || !chatId || !senderId) {
    return;
  }

  const participants = [...new Set([senderId, recipientId].filter(Boolean).map(String))].sort();
  const participantNames = {
    [senderId]: senderName || 'Você',
  };

  if (recipientId) {
    participantNames[recipientId] = recipientName || 'Usuário';
  }

  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    {
      participants,
      participantNames,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: trimmedMessage,
    senderId,
    senderName: senderName || 'Você',
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: trimmedMessage,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
    [`unreadCountByUser.${senderId}`]: 0,
    ...(recipientId
      ? { [`unreadCountByUser.${recipientId}`]: increment(1) }
      : {}),
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

  const participants = [userId, participantId].filter(Boolean).map(String);
  const participantNames = {
    [userId]: userName || 'Você',
  };

  if (participantId) {
    participantNames[String(participantId)] = participantName || 'Usuário';
  }

  const chatRef = doc(db, 'chats', chatId);

  await setDoc(
    chatRef,
    {
      participants,
      participantNames,
      createdAt: serverTimestamp(),
      typingByUser: {
        [userId]: Boolean(isTyping),
      },
      typingUpdatedAtByUser: {
        [userId]: serverTimestamp(),
      },
    },
    { merge: true },
  );
};
