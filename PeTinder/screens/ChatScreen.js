import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CustomHeader } from '../components/CustomHeader';
import ChatCard from '../components/Chat/ChatCard';
import api from '../api';
import { getAuthSession } from '../storage/authSession';
import { buildDirectChatId, subscribeToUserChats } from '../services/chatFirebase';
import { hasRequiredFirebaseConfig } from '../services/firebase';

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
  const title = route.params?.title || 'Chat';
  const [users, setUsers] = useState([]);
  const [firebaseChatsById, setFirebaseChatsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('Você');
  const [apiError, setApiError] = useState('');
  const [firebaseError, setFirebaseError] = useState('');

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
      }

      setIsLoading(false);

      unsubscribe = subscribeToUserChats(
        userId,
        (chats) => {
          const mappedById = chats.reduce((accumulator, chat) => {
            accumulator[chat.id] = chat;
            return accumulator;
          }, {});
          setFirebaseChatsById(mappedById);
        },
        (error) => {
          setFirebaseError(error?.message || 'Erro ao carregar chats do Firebase.');
        },
      );
    };

    init().catch((error) => {
      setApiError(error?.message || 'Erro ao iniciar chat.');
      setIsLoading(false);
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

      {isLoading && <Text style={styles.loadingText}>Carregando conversas...</Text>}

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
        ListEmptyComponent={!isLoading ? <Text style={styles.loadingText}>Nenhum usuário encontrado.</Text> : null}
      />
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
  listContent: {
    paddingBottom: 24,
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
