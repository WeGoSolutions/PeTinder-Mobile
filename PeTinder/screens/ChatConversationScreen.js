import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";
import { CustomHeader } from "../components/CustomHeader";
import { getAuthSession } from "../storage/authSession";
import {
  buildDirectChatId,
  markChatAsRead,
  sendMessageToChat,
  setTypingStatus,
  subscribeToChat,
  subscribeToMessages,
} from "../services/chatFirebase";
import { hasRequiredFirebaseConfig } from "../services/firebase";

const formatTime = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  const date =
    typeof timestamp?.toDate === "function"
      ? timestamp.toDate()
      : timestamp instanceof Date
        ? timestamp
        : null;

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timestampToMillis = (timestamp) => {
  if (!timestamp) {
    return 0;
  }

  if (typeof timestamp?.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  return 0;
};

const ChatConversationScreen = ({ navigation }) => {
  const route = useRoute();
  const userName = route.params?.userName || "Usuário";
  const chatId = route.params?.chatId || "";
  const participantId = route.params?.participantId || null;
  const [currentUserId, setCurrentUserId] = useState(
    route.params?.currentUserId || "mock-user-id",
  );
  const [currentUserName, setCurrentUserName] = useState(
    route.params?.currentUserName || "Você",
  );
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const listRef = useRef(null);
  const lastMarkedMessageIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const dotsAnim = useRef(new Animated.Value(0)).current;

  const resolvedChatId = useMemo(
    () => chatId || buildDirectChatId(currentUserId, participantId),
    [chatId, currentUserId, participantId],
  );

  useEffect(() => {
    const loadSession = async () => {
      const session = await getAuthSession();

      if (session?.id) {
        setCurrentUserId(session.id);
      }

      if (session?.nome) {
        setCurrentUserName(session.nome);
      }
    };

    loadSession().catch(() => {});
  }, []);

  useEffect(() => {
    markChatAsRead(resolvedChatId, currentUserId).catch(() => {});

    const unsubscribe = subscribeToMessages(
      resolvedChatId,
      (nextMessages) => {
        setMessages(nextMessages);

        const lastMessage = nextMessages[nextMessages.length - 1];

        if (lastMessage?.id && lastMarkedMessageIdRef.current !== lastMessage.id) {
          lastMarkedMessageIdRef.current = lastMessage.id;
          markChatAsRead(resolvedChatId, currentUserId).catch(() => {});
        }
      },
      (error) => {
        setErrorMessage(error?.message || "Erro ao carregar mensagens.");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [resolvedChatId, currentUserId]);

  useEffect(() => {
    const unsubscribe = subscribeToChat(
      resolvedChatId,
      (chat) => {
        setChatMeta(chat || null);
        const typingByUser = chat?.typingByUser || {};
        const otherTyping = Boolean(participantId && typingByUser[participantId]);
        setIsOtherTyping(otherTyping);
      },
      () => {},
    );

    return () => {
      unsubscribe();
    };
  }, [resolvedChatId, participantId]);

  useEffect(() => {
    if (!isOtherTyping) {
      dotsAnim.stopAnimation();
      dotsAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(dotsAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      dotsAnim.stopAnimation();
      dotsAnim.setValue(0);
    };
  }, [dotsAnim, isOtherTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current) {
        setTypingStatus({
          chatId: resolvedChatId,
          userId: currentUserId,
          isTyping: false,
          participantId,
          userName: currentUserName,
          participantName: userName,
        }).catch(() => {});
      }
    };
  }, [resolvedChatId, currentUserId, participantId, currentUserName, userName]);

  const normalizedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        isMine: message.senderId === currentUserId,
      })),
    [messages, currentUserId],
  );

  const displayedMessages = useMemo(
    () => [...normalizedMessages].reverse(),
    [normalizedMessages],
  );

  const participantLastReadMillis = timestampToMillis(
    chatMeta?.lastReadAtByUser?.[participantId],
  );

  const handleSend = async () => {
    const trimmedMessage = String(messageText || "").trim();

    if (!trimmedMessage) {
      return;
    }

    const optimisticMessageId = `local-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticMessageId,
      text: trimmedMessage,
      senderId: currentUserId,
      senderName: currentUserName,
      createdAt: new Date(),
    };

    setErrorMessage("");
    setMessageText("");
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    setTypingStatus({
      chatId: resolvedChatId,
      userId: currentUserId,
      isTyping: false,
      participantId,
      userName: currentUserName,
      participantName: userName,
    }).catch(() => {});

    try {
      await sendMessageToChat({
        chatId: resolvedChatId,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientId: participantId,
        recipientName: userName,
        messageText: trimmedMessage,
      });
    } catch (error) {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== optimisticMessageId),
      );
      setMessageText(trimmedMessage);
      setErrorMessage(error?.message || "Erro ao enviar mensagem.");
    }
  };

  const handleChangeText = (value) => {
    setMessageText(value);

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current) {
        isTypingRef.current = false;
        setTypingStatus({
          chatId: resolvedChatId,
          userId: currentUserId,
          isTyping: false,
          participantId,
          userName: currentUserName,
          participantName: userName,
        }).catch(() => {});
      }
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTypingStatus({
        chatId: resolvedChatId,
        userId: currentUserId,
        isTyping: true,
        participantId,
        userName: currentUserName,
        participantName: userName,
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTypingStatus({
        chatId: resolvedChatId,
        userId: currentUserId,
        isTyping: false,
        participantId,
        userName: currentUserName,
        participantName: userName,
      }).catch(() => {});
    }, 1400);
  };

  const dot1Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0.25, 1, 0.25, 0.25],
  });
  const dot2Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.15, 0.35, 1],
    outputRange: [0.25, 0.25, 1, 0.25],
  });
  const dot3Opacity = dotsAnim.interpolate({
    inputRange: [0, 0.35, 0.55, 1],
    outputRange: [0.25, 0.25, 1, 0.25],
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <CustomHeader onBack={() => navigation.goBack()} title={userName} />

        {!hasRequiredFirebaseConfig && (
          <Text style={styles.hintText}>
            Firebase não configurado. Defina EXPO_PUBLIC_FIREBASE_* no .env.
          </Text>
        )}

        {Boolean(errorMessage) && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <FlatList
          ref={listRef}
          data={displayedMessages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.isMine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
              <View style={styles.messageMetaRow}>
                <Text style={styles.messageTime}>
                  {formatTime(item.createdAt)}
                </Text>
                {item.isMine && (
                  <View style={styles.messageStatusRow}>
                    <MaterialIcons
                      name={
                        participantLastReadMillis >= timestampToMillis(item.createdAt)
                          ? "done-all"
                          : "done"
                      }
                      size={13}
                      color={
                        participantLastReadMillis >= timestampToMillis(item.createdAt)
                          ? "#76D1FF"
                          : "#F2D5DF"
                      }
                    />
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.placeholder}>
              Sem mensagens ainda. Envie a primeira mensagem.
            </Text>
          }
        />

        {isOtherTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingDotsRow}>
              <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
              <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
              <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
            </View>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={messageText}
            onChangeText={handleChangeText}
            style={styles.input}
            placeholder="Digite sua mensagem"
            placeholderTextColor="#919191"
          />
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendButtonPressed,
            ]}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  hintText: {
    color: "#CFCFCF",
    marginHorizontal: 20,
    marginTop: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  errorText: {
    color: "#FF7F7F",
    marginHorizontal: 20,
    marginTop: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 15,
  },
  myMessage: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 0,
    alignSelf: "flex-end",
    backgroundColor: "#E24476",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#343434",
  },
  messageText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  messageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    color: "#E9E9E9",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  messageStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  placeholder: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: 16,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "#1A1A1A",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 14,
    marginBottom: 4,
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  typingDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDDDDD",
  },
  input: {
    flex: 1,
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
  },
  sendButton: {
    backgroundColor: "#E24476",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
});

export default ChatConversationScreen;
