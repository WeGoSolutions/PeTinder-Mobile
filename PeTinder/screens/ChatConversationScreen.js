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
  Image,
  Alert,
  Modal,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useRoute } from "@react-navigation/native";
import { CustomHeader } from "../components/CustomHeader";
import { getAuthSession } from "../storage/authSession";
import api from "../api";
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

const formatAudioDuration = (durationMs) => {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getAudioMimeTypeByUri = (uri) => {
  const normalizedUri = String(uri || "").toLowerCase();

  if (normalizedUri.endsWith(".m4a") || normalizedUri.endsWith(".mp4")) {
    return "audio/mp4";
  }

  if (normalizedUri.endsWith(".aac")) {
    return "audio/aac";
  }

  if (normalizedUri.endsWith(".3gp") || normalizedUri.endsWith(".3gpp")) {
    return "audio/3gpp";
  }

  if (normalizedUri.endsWith(".amr")) {
    return "audio/amr";
  }

  if (normalizedUri.endsWith(".caf")) {
    return "audio/x-caf";
  }

  if (normalizedUri.endsWith(".wav")) {
    return "audio/wav";
  }

  if (normalizedUri.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  return "audio/mp4";
};

const getImageExtensionByUri = (uri) => {
  const normalizedUri = String(uri || "").toLowerCase();

  if (normalizedUri.includes(".png")) {
    return "png";
  }

  if (normalizedUri.includes(".webp")) {
    return "webp";
  }

  if (normalizedUri.includes(".heic") || normalizedUri.includes(".heif")) {
    return "heic";
  }

  return "jpg";
};

const RECORDING_OPTIONS = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

const extractAiResponseText = (responseData) => {
  if (typeof responseData === "string") {
    return responseData.trim();
  }

  if (!responseData || typeof responseData !== "object") {
    return "";
  }

  return String(
    responseData?.message
      || responseData?.resposta
      || responseData?.response
      || responseData?.reply
      || responseData?.content
      || "",
  ).trim();
};

const generateConversationId = () =>
  `conv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getAiChatEndpoint = () => {
  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || "").trim();
  const baseWithoutApi = apiUrl.replace(/\/api\/?$/i, "");

  if (!baseWithoutApi) {
    return "/chat";
  }

  return `${baseWithoutApi}/chat`;
};

const buildAiErrorMessage = (error) => {
  const statusCode = Number(error?.response?.status || 0);

  if (statusCode === 429) {
    return "Estou com muitas requisicoes agora. Tente novamente em alguns segundos.";
  }

  if (statusCode >= 500) {
    return "Estou indisponivel no momento. Tente novamente em instantes.";
  }

  return "Nao consegui responder agora. Pode tentar de novo?";
};

const ChatConversationScreen = ({ navigation }) => {
  const route = useRoute();
  const userName = route.params?.userName || "Usuário";
  const chatId = route.params?.chatId || "";
  const participantId = route.params?.participantId || null;
  const isAiChat = Boolean(route.params?.isAiChat);
  const aiConversationIdRef = useRef(
    String(route.params?.aiConversationId || "") || generateConversationId(),
  );
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
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingAudioDurationMs, setRecordingAudioDurationMs] = useState(0);
  const [playingAudioMessageId, setPlayingAudioMessageId] = useState("");
  const [pendingImageUri, setPendingImageUri] = useState("");
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState("");
  const [pendingImageDescription, setPendingImageDescription] = useState("");
  const [isImageComposeVisible, setIsImageComposeVisible] = useState(false);
  const [focusedImageUri, setFocusedImageUri] = useState("");
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isAnimatingAiResponse, setIsAnimatingAiResponse] = useState(false);
  const listRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const soundRef = useRef(null);
  const lastMarkedMessageIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const aiResponseTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const isRecordPressActiveRef = useRef(false);
  const isRecordStartInProgressRef = useRef(false);
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
    if (!hasRequiredFirebaseConfig) {
      return () => {};
    }

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
    if (isAiChat || !hasRequiredFirebaseConfig) {
      return () => {};
    }

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
  }, [resolvedChatId, participantId, isAiChat]);

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

      if (aiResponseTimerRef.current) {
        clearInterval(aiResponseTimerRef.current);
      }

      if (isTypingRef.current) {
        if (!isAiChat) {
          setTypingStatus({
            chatId: resolvedChatId,
            userId: currentUserId,
            isTyping: false,
            participantId,
            userName: currentUserName,
            participantName: userName,
          }).catch(() => {});
        }
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }

      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [resolvedChatId, currentUserId, participantId, currentUserName, userName, isAiChat]);

  const animateAiResponseMessage = (messageId, fullText) =>
    new Promise((resolve) => {
      if (!messageId || !fullText) {
        setIsAnimatingAiResponse(false);
        resolve();
        return;
      }

      if (aiResponseTimerRef.current) {
        clearInterval(aiResponseTimerRef.current);
        aiResponseTimerRef.current = null;
      }

      setIsAnimatingAiResponse(true);
      let currentIndex = 0;
      const stepMs = 18;

      aiResponseTimerRef.current = setInterval(() => {
        currentIndex += 1;
        const nextText = fullText.slice(0, currentIndex);

        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.id === messageId
              ? {
                ...message,
                text: nextText,
              }
              : message,
          ),
        );

        if (currentIndex % 8 === 0 || currentIndex >= fullText.length) {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }

        if (currentIndex >= fullText.length) {
          if (aiResponseTimerRef.current) {
            clearInterval(aiResponseTimerRef.current);
            aiResponseTimerRef.current = null;
          }
          setIsAnimatingAiResponse(false);
          resolve();
        }
      }, stepMs);
    });

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    stopRecordingTimer();

    recordingTimerRef.current = setInterval(async () => {
      if (!recordingRef.current) {
        return;
      }

      try {
        const status = await recordingRef.current.getStatusAsync();

        if (status?.canRecord) {
          setRecordingAudioDurationMs(status.durationMillis || 0);
        }
      } catch {
        // Ignora falhas transitórias de status durante gravação.
      }
    }, 250);
  };

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

  const startHoldToRecordAudio = async () => {
    if (isSendingAudio || isSendingImage || isRecordingAudio || isRecordStartInProgressRef.current) {
      return;
    }

    try {
      isRecordStartInProgressRef.current = true;
      setErrorMessage("");

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage("Permissão de microfone não concedida.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();

      recordingRef.current = recording;
      setRecordingAudioDurationMs(0);
      setIsRecordingAudio(true);
      startRecordingTimer();

      if (!isRecordPressActiveRef.current) {
        stopHoldToRecordAndSendAudio();
      }
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível iniciar a gravação.");
    } finally {
      isRecordStartInProgressRef.current = false;
    }
  };

  const stopHoldToRecordAndSendAudio = async () => {
    const recording = recordingRef.current;
    let optimisticMessageId = "";

    if (!recording || isSendingAudio) {
      return;
    }

    try {
      setIsSendingAudio(true);
      stopRecordingTimer();

      recordingRef.current = null;

      const statusBeforeStop = await recording.getStatusAsync();
      const durationMs = statusBeforeStop?.durationMillis || recordingAudioDurationMs || 0;

      await recording.stopAndUnloadAsync();
      setIsRecordingAudio(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (durationMs < 350) {
        setRecordingAudioDurationMs(0);
        return;
      }

      const recordingUri = recording.getURI();

      if (!recordingUri) {
        throw new Error("Não foi possível obter o áudio gravado.");
      }

      const audioMimeType = getAudioMimeTypeByUri(recordingUri);
      optimisticMessageId = `local-audio-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticMessageId,
        text: "",
        audioUrl: recordingUri,
        audioDurationMs: durationMs,
        type: "audio",
        senderId: currentUserId,
        senderName: currentUserName,
        createdAt: new Date(),
      };

      setErrorMessage("");
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      await sendMessageToChat({
        chatId: resolvedChatId,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientId: participantId,
        recipientName: userName,
        messageText: "",
        audioFileUri: recordingUri,
        audioMimeType,
        audioDurationMs: durationMs,
      });

      setRecordingAudioDurationMs(0);
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível enviar o áudio.");
      if (optimisticMessageId) {
        setMessages((prevMessages) =>
          prevMessages.filter((message) => message.id !== optimisticMessageId),
        );
      }
    } finally {
      setIsRecordingAudio(false);
      setIsSendingAudio(false);
      setRecordingAudioDurationMs(0);
    }
  };

  const handleRecordPressIn = () => {
    isRecordPressActiveRef.current = true;
    startHoldToRecordAudio();
  };

  const handleRecordPressOut = () => {
    isRecordPressActiveRef.current = false;
    stopHoldToRecordAndSendAudio();
  };

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

    if (!isAiChat) {
      setTypingStatus({
        chatId: resolvedChatId,
        userId: currentUserId,
        isTyping: false,
        participantId,
        userName: currentUserName,
        participantName: userName,
      }).catch(() => {});
    }

    try {
      if (isAiChat) {
        if (hasRequiredFirebaseConfig) {
          await sendMessageToChat({
            chatId: resolvedChatId,
            senderId: currentUserId,
            senderName: currentUserName,
            recipientId: "petinder-ai",
            recipientName: "PeTinder IA",
            messageText: trimmedMessage,
          });
        }

        setIsOtherTyping(true);

        const response = await api.post(getAiChatEndpoint(), {
          message: trimmedMessage,
          conversationId: aiConversationIdRef.current,
        });

        const aiResponseText = extractAiResponseText(response?.data);

        if (!aiResponseText) {
          throw new Error("A IA não retornou uma mensagem válida.");
        }

        const aiMessage = {
          id: `ai-${Date.now()}`,
          text: "",
          senderId: "petinder-ai",
          senderName: "PeTinder IA",
          createdAt: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setIsOtherTyping(false);
        await animateAiResponseMessage(aiMessage.id, aiResponseText);

        if (hasRequiredFirebaseConfig) {
          await sendMessageToChat({
            chatId: resolvedChatId,
            senderId: "petinder-ai",
            senderName: "PeTinder IA",
            recipientId: currentUserId,
            recipientName: currentUserName,
            messageText: aiResponseText,
          });
        }

        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        return;
      }

      await sendMessageToChat({
        chatId: resolvedChatId,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientId: participantId,
        recipientName: userName,
        messageText: trimmedMessage,
      });
    } catch (error) {
      if (isAiChat) {
        const aiErrorMessage = {
          id: `ai-error-${Date.now()}`,
          text: buildAiErrorMessage(error),
          senderId: "petinder-ai",
          senderName: "PeTinder IA",
          createdAt: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, aiErrorMessage]);

        if (hasRequiredFirebaseConfig) {
          sendMessageToChat({
            chatId: resolvedChatId,
            senderId: "petinder-ai",
            senderName: "PeTinder IA",
            recipientId: currentUserId,
            recipientName: currentUserName,
            messageText: aiErrorMessage.text,
          }).catch(() => {});
        }

        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        setErrorMessage("");
        return;
      }

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== optimisticMessageId),
      );
      setMessageText(trimmedMessage);
      setErrorMessage(error?.message || "Erro ao enviar mensagem.");
    } finally {
      if (isAiChat) {
        if (!isAnimatingAiResponse) {
          setIsOtherTyping(false);
        }
      }
    }
  };

  const handlePickImage = async (source) => {
    try {
      setErrorMessage("");

      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage(
          source === "camera"
            ? "Permissão da câmera não concedida."
            : "Permissão da galeria não concedida.",
        );
        return;
      }

      const pickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.75,
        base64: true,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const imageMimeType = asset?.mimeType || "image/jpeg";
      const imageBase64 = asset?.base64 || "";

      if (!imageBase64) {
        setErrorMessage("Não foi possível converter a imagem.");
        return;
      }

      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;
      setPendingImageUri(asset?.uri || imageDataUrl);
      setPendingImageDataUrl(imageDataUrl);
      setPendingImageDescription("");
      setIsImageComposeVisible(true);
    } catch (error) {
      setErrorMessage(error?.message || "Erro ao enviar imagem.");
    }
  };

  const resetImageComposeState = () => {
    setPendingImageUri("");
    setPendingImageDataUrl("");
    setPendingImageDescription("");
    setIsImageComposeVisible(false);
  };

  const handleConfirmSendImage = async () => {
    if (!pendingImageDataUrl) {
      return;
    }

    const imageToSend = pendingImageDataUrl;
    const previewImage = pendingImageUri || pendingImageDataUrl;
    const caption = String(pendingImageDescription || "").trim();
    const optimisticMessageId = `local-image-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticMessageId,
      text: caption,
      imageUrl: previewImage,
      type: "image",
      senderId: currentUserId,
      senderName: currentUserName,
      createdAt: new Date(),
    };

    try {
      setIsSendingImage(true);
      setErrorMessage("");
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      resetImageComposeState();

      await sendMessageToChat({
        chatId: resolvedChatId,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientId: participantId,
        recipientName: userName,
        messageText: caption,
        imageDataUrl: imageToSend,
      });
    } catch (error) {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== optimisticMessageId),
      );
      setErrorMessage(error?.message || "Erro ao enviar imagem.");
    } finally {
      setIsSendingImage(false);
    }
  };

  const handlePlayAudio = async (message) => {
    const audioMessageId = String(message?.id || "");
    const originalAudioUrl = String(message?.audioUrl || "");
    const isDataUrl = originalAudioUrl.startsWith("data:");
    let audioUrl = originalAudioUrl;

    if (!audioMessageId || !audioUrl) {
      return;
    }

    if (isDataUrl) {
      try {
        const matches = originalAudioUrl.match(/^data:(.*?);base64,(.*)$/);

        if (!matches?.[2]) {
          throw new Error("Áudio inválido.");
        }

        const mimeType = matches[1] || "audio/mp4";
        const extension = mimeType.includes("mpeg")
          ? "mp3"
          : mimeType.includes("wav")
            ? "wav"
            : mimeType.includes("caf")
              ? "caf"
              : mimeType.includes("3gp")
                ? "3gp"
                : "m4a";
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

        if (!cacheDir) {
          throw new Error("Armazenamento local indisponível para reproduzir áudio.");
        }

        const tempUri = `${cacheDir}chat-audio-${audioMessageId}.${extension}`;
        const base64Encoding = FileSystem?.EncodingType?.Base64 || "base64";
        await FileSystem.writeAsStringAsync(tempUri, matches[2], {
          encoding: base64Encoding,
        });
        audioUrl = tempUri;
      } catch (error) {
        setErrorMessage(error?.message || "Não foi possível preparar o áudio.");
        return;
      }
    }

    try {
      if (playingAudioMessageId === audioMessageId && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingAudioMessageId("");
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setPlayingAudioMessageId(audioMessageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status?.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          setPlayingAudioMessageId("");
        }
      });
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível reproduzir o áudio.");
      setPlayingAudioMessageId("");
    }
  };

  const handleOpenImageOptions = () => {
    if (isSendingImage) {
      return;
    }

    Alert.alert("Enviar imagem", "Escolha uma opção", [
      {
        text: "Câmera",
        onPress: () => handlePickImage("camera"),
      },
      {
        text: "Galeria",
        onPress: () => handlePickImage("gallery"),
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  const handleDownloadFocusedImage = async () => {
    const imageUri = String(focusedImageUri || "");
    const albumName = "PeTinder";

    if (!imageUri || isDownloadingImage) {
      return;
    }

    try {
      setIsDownloadingImage(true);
      setErrorMessage("");

      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage("Permissão da galeria não concedida para salvar imagem.");
        return;
      }

      let localImageUri = imageUri;

      if (imageUri.startsWith("data:")) {
        const matches = imageUri.match(/^data:(.*?);base64,(.*)$/);

        if (!matches?.[2]) {
          throw new Error("Imagem inválida para download.");
        }

        const mimeType = String(matches[1] || "image/jpeg").toLowerCase();
        const extension = mimeType.includes("png")
          ? "png"
          : mimeType.includes("webp")
            ? "webp"
            : mimeType.includes("heic") || mimeType.includes("heif")
              ? "heic"
              : "jpg";
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

        if (!cacheDir) {
          throw new Error("Armazenamento local indisponível.");
        }

        const fileUri = `${cacheDir}petinder-image-${Date.now()}.${extension}`;
        const base64Encoding = FileSystem?.EncodingType?.Base64 || "base64";
        await FileSystem.writeAsStringAsync(fileUri, matches[2], {
          encoding: base64Encoding,
        });
        localImageUri = fileUri;
      } else if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

        if (!cacheDir) {
          throw new Error("Armazenamento local indisponível.");
        }

        const extension = getImageExtensionByUri(imageUri);
        const fileUri = `${cacheDir}petinder-image-${Date.now()}.${extension}`;
        const downloadedFile = await FileSystem.downloadAsync(imageUri, fileUri);
        localImageUri = downloadedFile.uri;
      }

      const createdAsset = await MediaLibrary.createAssetAsync(localImageUri);
      const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

      if (!existingAlbum) {
        await MediaLibrary.createAlbumAsync(albumName, createdAsset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([createdAsset], existingAlbum, false);
      }

      Alert.alert(
        "Download concluído",
        `Imagem salva no álbum ${albumName} do celular.`,
      );
    } catch (error) {
      setErrorMessage(error?.message || "Não foi possível baixar a imagem.");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleChangeText = (value) => {
    setMessageText(value);

    if (isAiChat) {
      return;
    }

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

        {!isAiChat && !hasRequiredFirebaseConfig && (
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
              <Text style={styles.senderNameText}>
                {item?.senderName || (item.isMine ? "Você" : "Usuário")}
              </Text>
              {Boolean(item?.imageUrl) && (
                <Pressable onPress={() => setFocusedImageUri(item.imageUrl)}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
              {Boolean(item?.audioUrl) && (
                <Pressable
                  onPress={() => handlePlayAudio(item)}
                  style={styles.audioMessageButton}
                >
                  <MaterialIcons
                    name={playingAudioMessageId === item.id ? "stop-circle" : "play-circle-filled"}
                    size={26}
                    color="#FFFFFF"
                  />
                  <Text style={styles.audioMessageText}>
                    {playingAudioMessageId === item.id ? "Parar áudio" : "Ouvir áudio"}
                  </Text>
                  <Text style={styles.audioMessageDurationText}>
                    {formatAudioDuration(item?.audioDurationMs)}
                  </Text>
                </Pressable>
              )}
              {Boolean(item?.text) && <Text style={styles.messageText}>{item.text}</Text>}
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
          {!isAiChat && (
            <Pressable
              onPressIn={handleRecordPressIn}
              onPressOut={handleRecordPressOut}
              style={({ pressed }) => [
                styles.recordButton,
                isRecordingAudio && styles.recordButtonActive,
                pressed && styles.sendButtonPressed,
                (isSendingAudio || isSendingImage) && styles.sendButtonDisabled,
              ]}
              disabled={isSendingAudio || isSendingImage}
            >
              <MaterialIcons
                name={isRecordingAudio ? "graphic-eq" : "mic"}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          )}

          {!isAiChat && (
            <Pressable
              onPress={handleOpenImageOptions}
              style={({ pressed }) => [
                styles.attachButton,
                pressed && styles.sendButtonPressed,
                isSendingImage && styles.sendButtonDisabled,
              ]}
              disabled={isSendingImage}
            >
              <MaterialIcons name="image" size={20} color="#FFFFFF" />
            </Pressable>
          )}

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
              (isSendingAudio || isSendingImage || isOtherTyping || isAnimatingAiResponse) && styles.sendButtonDisabled,
            ]}
            disabled={isSendingAudio || isSendingImage || isOtherTyping || isAnimatingAiResponse}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </Pressable>
        </View>

        {isRecordingAudio && (
          <View style={styles.recordingHintRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingHintText}>
              Gravando... solte para enviar {formatAudioDuration(recordingAudioDurationMs)}
            </Text>
          </View>
        )}

        <Modal
          visible={isImageComposeVisible}
          transparent
          animationType="fade"
          onRequestClose={resetImageComposeState}
        >
          <View style={styles.focusModalRoot}>
            <Pressable
              style={styles.focusModalBackdrop}
              onPress={resetImageComposeState}
            />

            <View style={styles.composeModalCard}>
              <Image
                source={{ uri: pendingImageUri || pendingImageDataUrl }}
                style={styles.composePreviewImage}
                resizeMode="cover"
              />

              <TextInput
                value={pendingImageDescription}
                onChangeText={setPendingImageDescription}
                placeholder="Adicione uma descrição..."
                placeholderTextColor="#9A9A9A"
                style={styles.composeInput}
                editable={!isSendingImage}
              />

              <View style={styles.composeActionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.composeCancelButton,
                    pressed && styles.sendButtonPressed,
                  ]}
                  onPress={resetImageComposeState}
                  disabled={isSendingImage}
                >
                  <Text style={styles.composeCancelText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.composeSendButton,
                    pressed && styles.sendButtonPressed,
                    isSendingImage && styles.sendButtonDisabled,
                  ]}
                  onPress={handleConfirmSendImage}
                  disabled={isSendingImage}
                >
                  <Text style={styles.composeSendText}>
                    {isSendingImage ? "Enviando..." : "Enviar imagem"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={Boolean(focusedImageUri)}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isDownloadingImage) {
              setFocusedImageUri("");
            }
          }}
        >
          <View style={styles.focusModalRoot}>
            <Pressable
              style={styles.focusModalBackdrop}
              onPress={() => {
                if (!isDownloadingImage) {
                  setFocusedImageUri("");
                }
              }}
            />

            <View style={styles.focusImageContainer}>
              <Image
                source={{ uri: focusedImageUri }}
                style={styles.focusImage}
                resizeMode="contain"
              />
            </View>

            <Pressable
              style={[styles.focusActionButton, styles.focusDownloadButton]}
              onPress={handleDownloadFocusedImage}
              disabled={isDownloadingImage}
            >
              <MaterialIcons
                name={isDownloadingImage ? "hourglass-top" : "download"}
                size={24}
                color="#FFFFFF"
              />
            </Pressable>

            <Pressable
              style={[styles.focusActionButton, styles.focusCloseButton]}
              onPress={() => setFocusedImageUri("")}
              disabled={isDownloadingImage}
            >
              <MaterialIcons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </Modal>
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
  senderNameText: {
    color: "#FFD6E6",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginBottom: 4,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#2D2D2D",
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
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#383838",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: {
    backgroundColor: "#C53764",
  },
  recordingHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5E87",
  },
  recordingHintText: {
    color: "#FFD8E5",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  pendingAudioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  pendingAudioText: {
    color: "#D4E8FF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    flex: 1,
  },
  pendingAudioDiscardButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  audioMessageButton: {
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 190,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  audioMessageText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    flex: 1,
  },
  audioMessageDurationText: {
    color: "#F3E3EA",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
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
  composeModalCard: {
    width: "92%",
    borderRadius: 14,
    backgroundColor: "#1E1E1E",
    overflow: "hidden",
    paddingBottom: 12,
  },
  composePreviewImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#111111",
  },
  composeInput: {
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2C2C2C",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
  },
  composeActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
  },
  composeCancelButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  composeCancelText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  composeSendButton: {
    borderRadius: 10,
    backgroundColor: "#E24476",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  composeSendText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  focusModalRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  focusModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  focusImageContainer: {
    width: "92%",
    height: "78%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111111",
  },
  focusImage: {
    width: "100%",
    height: "100%",
  },
  focusActionButton: {
    position: "absolute",
    top: 46,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  focusDownloadButton: {
    left: 18,
  },
  focusCloseButton: {
    right: 18,
  },
});

export default ChatConversationScreen;
