import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

const PetInfoOverlay = ({ pet, onToggleDetails, liked, likesCount, onToggleLike }) => {
  const sexSymbol = pet.sex === 'M' ? '♂' : '♀';
  const tags = Array.isArray(pet.tags) ? pet.tags : [];
  const visibleTags = tags.slice(0, 3);
  const hasMoreTags = tags.length > visibleTags.length;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={styles.infoTouchArea} onPress={onToggleDetails}>
        <View style={styles.infoContainer}>
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.sexSymbol}>{sexSymbol}</Text>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.age}>{pet.age}</Text>
            </View>

            <View style={styles.tagsRow}>
              {visibleTags.map((tag) => (
                <View key={tag.label} style={[styles.tag, { backgroundColor: tag.color }]}
                >
                  <Text style={styles.tagText}>{tag.label}</Text>
                </View>
              ))}
              {hasMoreTags && (
                <View style={styles.moreTag}>
                  <Text style={styles.moreTagText}>...</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionsRight}>
            <View style={styles.likesBubble}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.();
                  onToggleLike?.();
                }}
                hitSlop={8}
                style={styles.likePressable}
              >
                <Image
                  source={
                    liked
                      ? require('../../assets/liked-icon.png')
                      : require('../../assets/like-icon.png')
                  }
                  style={styles.likeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.likesCount}>{likesCount}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.expandButton} onPress={onToggleDetails}>
              <Image
                source={require('../../assets/up-icon.png')}
                style={styles.expandIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  infoTouchArea: {
    width: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sexSymbol: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 35,
    fontFamily: 'Poppins_700Bold',
    maxWidth: '67%',
  },
  age: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  moreTag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textShadowColor: '#111',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0.5,
  },
  moreTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Poppins_700Bold',
  },
  actionsRight: {
    alignItems: 'center',
    gap: 8,
  },
  likesBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    width: 40,
    height: 40,
  },
  likePressable: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  likesCount: {
    ...StyleSheet.absoluteFillObject,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 42,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  expandButton: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: '#202020',
    borderWidth: 1.5,
    borderColor: '#323232',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    width: 26,
  },
});

export default PetInfoOverlay;
