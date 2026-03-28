import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";

const ChatCard = ({
  name = "Buddy",
  lastMessage = "Hey! How are you?",
  isLastMessageMine = false,
  lastMessageTime = "",
  unreadCount = 0,
  avatar,
  onPress,
}) => {
  const avatarSource = avatar
    ? typeof avatar === "string"
      ? { uri: avatar }
      : avatar
    : require("../../assets/generic-user-icon.png");

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={avatarSource}
        style={styles.avatar}
      />

      <View style={styles.textsContainer}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.name}>{name}</Text>
          {Boolean(lastMessageTime) && <Text style={styles.time}>{lastMessageTime}</Text>}
        </View>

        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {isLastMessageMine ? 'Você: ' : ''}
            {lastMessage}
          </Text>

          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#323232",
    flexDirection: "row",
    padding: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: "#F4F4F4",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: "#F4F4F4",
    opacity: 0.8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textsContainer: {
    justifyContent: "center",
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#D5D5D5',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E24476',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
});

export default ChatCard;
