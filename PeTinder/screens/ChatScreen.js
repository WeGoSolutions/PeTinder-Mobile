import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import ChatCard from '../components/Chat/ChatCard';
import api from '../api';
import { getAuthSession } from '../storage/authSession';
import {
  buildDirectChatId,
  createGroupChat,
  subscribeToUserChats,
} from '../services/chatFirebase';
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
  const [pets, setPets] = useState([]);
  const [firebaseChatsById, setFirebaseChatsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPetsLoaded, setIsPetsLoaded] = useState(false);
  const [isChatsLoaded, setIsChatsLoaded] = useState(!hasRequiredFirebaseConfig);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('Você');
  const [apiError, setApiError] = useState('');
  const [firebaseError, setFirebaseError] = useState('');
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUserIds, setSelectedGroupUserIds] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupCreateError, setGroupCreateError] = useState('');

  useEffect(() => {
    setIsLoading(!(isPetsLoaded && isChatsLoaded));
  }, [isPetsLoaded, isChatsLoaded]);

  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      const session = await getAuthSession();
      const userId = session?.id || 'mock-user-id';
      const userName = session?.nome || 'Você';

      setCurrentUserId(userId);
      setCurrentUserName(userName);

       try {
        const response = await api.get(`/status/${userId}/PENDING`);
        const allPets = Array.isArray(response?.data) ? response.data : [];
        setPets(allPets);
      } catch (error) {
        setApiError(error?.response?.data?.message || 'Erro ao carregar pets com status PENDING.');
      } finally {
        setIsPetsLoaded(true);
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
      setIsPetsLoaded(true);
      setIsChatsLoaded(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const chatList = useMemo(
    () => {
      const petChats = pets
        .map((pet) => {
          const chatId = buildDirectChatId(currentUserId, pet.ongId);
          const firebaseChat = firebaseChatsById[chatId];

          return {
            id: chatId || pet.petId,
            chatId,
            participantId: pet.ongId,
            petId: pet.petId,
            name: pet.petNome || 'Pet',
            lastMessage: firebaseChat?.lastMessage || 'Toque para iniciar conversa',
            isLastMessageMine: String(firebaseChat?.lastMessageSenderId || '') === String(currentUserId || ''),
            avatar: pet.imageUrl || null,
            lastMessageAt: timestampToMillis(firebaseChat?.updatedAt || firebaseChat?.createdAt),
            unreadCount: Number(firebaseChat?.unreadCountByUser?.[currentUserId] || 0),
            isGroup: false,
          };
        })
        .filter((item) => Boolean(item.participantId));

      const groupChats = Object.values(firebaseChatsById)
        .filter((chat) => Boolean(chat?.isGroup))
        .map((chat) => ({
          id: chat.id,
          chatId: chat.id,
          participantId: null,
          name: chat?.groupName || 'Grupo sem nome',
          lastMessage: chat?.lastMessage || 'Grupo criado',
          isLastMessageMine: String(chat?.lastMessageSenderId || '') === String(currentUserId || ''),
          avatar: null,
          lastMessageAt: timestampToMillis(chat?.updatedAt || chat?.createdAt),
          unreadCount: Number(chat?.unreadCountByUser?.[currentUserId] || 0),
          isGroup: true,
        }));

      const mergedById = new Map();

      [...petChats, ...groupChats].forEach((item) => {
        mergedById.set(item.id, item);
      });

      return Array.from(mergedById.values()).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
    [pets, currentUserId, firebaseChatsById],
  );

  const selectableUsers = useMemo(
    () => [],
    [],
  );

  const toggleGroupUser = (userId) => {
    setSelectedGroupUserIds((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId);
      }

      return [...prevSelected, userId];
    });
  };

  const openGroupModal = () => {
    setGroupCreateError('');
    setGroupName('');
    setSelectedGroupUserIds([]);
    setIsGroupModalVisible(true);
  };

  const closeGroupModal = () => {
    if (isCreatingGroup) {
      return;
    }

    setIsGroupModalVisible(false);
  };

  const handleCreateGroup = async () => {
    if (!hasRequiredFirebaseConfig) {
      setGroupCreateError('Firebase não configurado para criar grupos.');
      return;
    }

    const trimmedName = String(groupName || '').trim();

    if (!trimmedName) {
      setGroupCreateError('Informe um nome para o grupo.');
      return;
    }

    if (!selectedGroupUserIds.length) {
      setGroupCreateError('Selecione pelo menos uma pessoa para o grupo.');
      return;
    }

    try {
      setIsCreatingGroup(true);
      setGroupCreateError('');

      const selectedUsers = selectableUsers.filter((user) => selectedGroupUserIds.includes(user.id));

      const createdGroup = await createGroupChat({
        groupName: trimmedName,
        creatorId: String(currentUserId || ''),
        creatorName: currentUserName || 'Você',
        selectedUsers,
      });

      setIsGroupModalVisible(false);

      navigation.navigate('ChatConversation', {
        chatId: createdGroup.chatId,
        userName: createdGroup.groupName,
        participantId: null,
        currentUserId,
        currentUserName,
      });
    } catch (error) {
      setGroupCreateError(error?.message || 'Não foi possível criar o grupo.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const openConversation = (chat) => {
    navigation.navigate('ChatConversation', {
      chatId: chat.chatId || chat.id,
      userName: chat.name,
      participantId: chat.participantId || null,
      currentUserId,
      currentUserName,
    });
  };

  const openAiConversation = () => {
    navigation.navigate('ChatConversation', {
      chatId: `ai-chat-${String(currentUserId || 'anon')}`,
      userName: 'PeTinder IA',
      participantId: null,
      currentUserId,
      currentUserName,
      isAiChat: true,
    });
  };

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />
      <View style={styles.headerRow}>
        <Text style={styles.text}>Conversas</Text>
        <Pressable
          style={({ pressed }) => [styles.groupButton, pressed && styles.groupButtonPressed]}
          onPress={openGroupModal}
        >
          <Text style={styles.groupButtonText}>Novo grupo</Text>
        </Pressable>
      </View>

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
          ListEmptyComponent={<Text style={styles.loadingText}>Nenhuma conversa encontrada.</Text>}
        />
      )}

      <View style={[styles.aiButtonWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <AIButton onPress={openAiConversation} />
      </View>

      <Modal
        visible={isGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeGroupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Criar grupo</Text>

            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Nome do grupo"
              placeholderTextColor="#9A9A9A"
              style={styles.groupNameInput}
              editable={!isCreatingGroup}
            />

            <Text style={styles.modalSectionTitle}>Selecione os participantes</Text>

            <FlatList
              data={selectableUsers}
              keyExtractor={(item) => item.id}
              style={styles.usersList}
              contentContainerStyle={styles.usersListContent}
              renderItem={({ item }) => {
                const isSelected = selectedGroupUserIds.includes(item.id);

                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.userRow,
                      isSelected && styles.userRowSelected,
                      pressed && styles.userRowPressed,
                    ]}
                    onPress={() => toggleGroupUser(item.id)}
                    disabled={isCreatingGroup}
                  >
                    <Text style={styles.userRowName}>{item.name}</Text>
                    <Text style={styles.userRowCheck}>{isSelected ? '✓' : ''}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.modalHint}>Nenhum usuário disponível.</Text>}
            />

            {Boolean(groupCreateError) && <Text style={styles.modalError}>{groupCreateError}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalButtonPressed]}
                onPress={closeGroupModal}
                disabled={isCreatingGroup}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalCreateButton,
                  pressed && styles.modalButtonPressed,
                  isCreatingGroup && styles.modalCreateButtonDisabled,
                ]}
                onPress={handleCreateGroup}
                disabled={isCreatingGroup}
              >
                <Text style={styles.modalCreateText}>
                  {isCreatingGroup ? 'Criando...' : 'Criar grupo'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 20,
    marginBottom: 10,
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  groupButton: {
    backgroundColor: '#2B2B2B',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupButtonPressed: {
    opacity: 0.85,
  },
  groupButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    padding: 16,
    maxHeight: '82%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    marginBottom: 12,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
  },
  modalSectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  usersList: {
    maxHeight: 240,
  },
  usersListContent: {
    gap: 8,
    paddingBottom: 6,
  },
  userRow: {
    backgroundColor: '#2B2B2B',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRowSelected: {
    borderColor: '#FFC0D9',
    backgroundColor: '#3A2A32',
  },
  userRowPressed: {
    opacity: 0.85,
  },
  userRowName: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    flex: 1,
  },
  userRowCheck: {
    color: '#FFC0D9',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalHint: {
    color: '#BFBFBF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginVertical: 8,
  },
  modalError: {
    color: '#FF7F7F',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 10,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  modalCreateButton: {
    backgroundColor: '#FFC0D9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCreateButtonDisabled: {
    opacity: 0.7,
  },
  modalCreateText: {
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  modalButtonPressed: {
    opacity: 0.85,
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
