import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import ChatCard from '../components/Chat/ChatCard';
import api from '../api';
import { getAuthSession } from '../storage/authSession';
import { buildDirectChatId, subscribeToUserChats } from '../services/chatFirebase';
import { hasRequiredFirebaseConfig } from '../services/firebase';
import AIButton from '../components/Chat/AIButton';

const AI_BUTTON_HEIGHT = 72;

const timestampToMillis = (timestamp) => {
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

const formatChatTime = (millis) => {
  if (!millis) {
    return '';
  }

  const date = new Date(millis);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
};

const ChatScreen = ({ navigation }) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const title = route.params?.title || 'Chat';
  const [users, setUsers] = useState([]);
  const [firebaseChatsById, setFirebaseChatsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [isChatsLoaded, setIsChatsLoaded] = useState(!hasRequiredFirebaseConfig);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('Você');
  const [apiError, setApiError] = useState('');
  const [firebaseError, setFirebaseError] = useState('');

  useEffect(() => {
    setIsLoading(!(isUsersLoaded && isChatsLoaded));
  }, [isUsersLoaded, isChatsLoaded]);

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      const session = await getAuthSession();
      const userId = session?.id || 'mock-user-id';
      const userName = session?.nome || 'Você';

      setCurrentUserId(userId);
      setCurrentUserName(userName);

       try {
        const response = await api.get('/users');
        const allUsers = Array.isArray(response?.data) ? response.data : [];
        setUsers(allUsers);
      } catch (error) {
        setApiError(error?.response?.data?.message || 'Erro ao carregar usuários da API.');
      } finally {
        setIsUsersLoaded(true);
      }

      if (!hasRequiredFirebaseConfig) {
        setIsChatsLoaded(true);
      }

      unsubscribe = subscribeToUserChats(
        userId,
        (chats) => {
          const mappedById = chats.reduce((accumulator, chat) => {
            accumulator[chat.id] = chat;
            return accumulator;
          }, {});
          setFirebaseChatsById(mappedById);
          setIsChatsLoaded(true);
        },
        (error) => {
          setFirebaseError(error?.message || 'Erro ao carregar chats do Firebase.');
          setIsChatsLoaded(true);
        },
      );
    };

    init().catch((error) => {
      setApiError(error?.message || 'Erro ao iniciar chat.');
      setIsUsersLoaded(true);
      setIsChatsLoaded(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const chatList = useMemo(
    () => users
      .filter((user) => String(user?.id || '') !== String(currentUserId || ''))
      .map((user) => {
        const participantId = String(user?.id || '').trim();
        const chatId = buildDirectChatId(currentUserId, participantId);
        const firebaseChat = firebaseChatsById[chatId];

        return {
          id: chatId || participantId,
          chatId,
          participantId,
          name: user?.nome || 'Usuário',
          lastMessage: firebaseChat?.lastMessage || 'Toque para iniciar conversa',
          isLastMessageMine: String(firebaseChat?.lastMessageSenderId || '') === String(currentUserId || ''),
          avatar: user?.imagemUrl || null,
          lastMessageAt: timestampToMillis(firebaseChat?.updatedAt || firebaseChat?.createdAt),
          unreadCount: Number(firebaseChat?.unreadCountByUser?.[currentUserId] || 0),
        };
      })
      .filter((item) => Boolean(item.participantId))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    [users, currentUserId, firebaseChatsById],
  );

  const openConversation = (chat) => {
    navigation.navigate('ChatConversation', {
      chatId: chat.chatId || chat.id,
      userName: chat.name,
      participantId: chat.participantId || null,
      currentUserId,
      currentUserName,
    });
  };

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />
      <Text style={styles.text}>Conversas</Text>

      {!hasRequiredFirebaseConfig && (
        <Text style={styles.hintText}>
          Chat realtime depende do Firebase. Usuários já vêm da tua API.
        </Text>
      )}

      {Boolean(apiError) && <Text style={styles.errorText}>{apiError}</Text>}

      {Boolean(firebaseError) && <Text style={styles.errorText}>{firebaseError}</Text>}

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFC0D9" />
        </View>
      ) : (
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatCard
              name={item.name}
              lastMessage={item.lastMessage}
              isLastMessageMine={item.isLastMessageMine}
              lastMessageTime={formatChatTime(item.lastMessageAt)}
              unreadCount={item.unreadCount}
              avatar={item.avatar}
              onPress={() => openConversation(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.loadingText}>Nenhum usuário encontrado.</Text>}
        />
      )}

      <View style={[styles.aiButtonWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <AIButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    // alignItems: 'center',
  },
  text: {
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  list: {
    marginBottom: 115,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 115,
  },
  loadingTitle: {
    marginTop: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: 4,
    color: '#CFCFCF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  aiButtonWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: '#1A1A1A',
  },
  hintText: {
    color: '#CFCFCF',
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  errorText: {
    color: '#FF7F7F',
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  loadingText: {
    color: '#CFCFCF',
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
});

export default ChatScreen;
