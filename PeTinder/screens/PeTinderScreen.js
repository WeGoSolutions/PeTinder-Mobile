import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { NavBar } from '../components/PeTinder/NavBar';
import PetImageCarousel from '../components/PeTinder/PetImageCarousel';
import PetInfoOverlay from '../components/PeTinder/PetInfoOverlay';
import PetActionButtons from '../components/PeTinder/PetActionButtons';
import PetExpandedOverlay from '../components/PeTinder/PetExpandedOverlay';

const PET_PROFILES = [
  {
    id: 'kenny',
    name: 'Kenny',
    sex: 'M',
    age: '2 Anos',
    likes: 27,
    liked: false,
    images: [
      require('../assets/kenny1.png'),
      require('../assets/kenny2.png'),
    ],
    description:
      'Kenny adora explorar cantinhos da casa e se aconchegar no colo para tirar uma soneca. Ele é um companheiro fiel, sempre pronto para brincar ou fazer companhia nos momentos de descanso.',
    features: ['Vacinado', 'Castrado'],
    tags: [
      { label: 'Carinhoso', color: '#FF7DAA' },
      { label: 'Sociável', color: '#CDE88D' },
    ],
  },
  {
    id: 'thor',
    name: 'Thor',
    sex: 'M',
    age: '2 Anos',
    likes: 27,
    liked: false,
    images: [
      require('../assets/thor1.png'),
      require('../assets/thor2.png'),
    ],
    description:
      'Kenny adora explorar cantinhos da casa e se aconchegar no colo para tirar uma soneca. Ele é um companheiro fiel, sempre pronto para brincar ou fazer companhia nos momentos de descanso.',
    features: ['Vacinado', 'Castrado'],
    tags: [
      { label: 'Carinhoso', color: '#FF7DAA' },
      { label: 'Sociável', color: '#CDE88D' },
    ],
  },
];

const PeTinderScreen = ({ navigation }) => {
  const [pets, setPets] = useState(PET_PROFILES);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [isImageFocused, setIsImageFocused] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const hasOpenedBySwipe = useRef(false);
  const isImageFocusedRef = useRef(isImageFocused);
  const isDetailsExpandedRef = useRef(isDetailsExpanded);
  const currentPet = pets[currentPetIndex] || pets[0];

  isImageFocusedRef.current = isImageFocused;
  isDetailsExpandedRef.current = isDetailsExpanded;

  const openDetails = () => {
    if (!isImageFocusedRef.current && !isDetailsExpandedRef.current) {
      setIsDetailsExpanded(true);
    }
  };

  const screenPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isImageFocusedRef.current
          && !isDetailsExpandedRef.current
          && gestureState.dy < -10
          && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        hasOpenedBySwipe.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!hasOpenedBySwipe.current && gestureState.dy < -45) {
          hasOpenedBySwipe.current = true;
          openDetails();
        }
      },
      onPanResponderRelease: () => {
        hasOpenedBySwipe.current = false;
      },
      onPanResponderTerminate: () => {
        hasOpenedBySwipe.current = false;
      },
    }),
  ).current;

  const handleToggleDetails = () => {
    openDetails();
  };

  const handleCloseDetails = () => {
    setIsDetailsExpanded(false);
  };

  const handleFocusChange = (focused) => {
    setIsImageFocused(focused);

    if (focused) {
      setIsDetailsExpanded(false);
    }
  };

  const handleToggleLike = () => {
    setPets((prevPets) => {
      const nextPets = [...prevPets];
      const selectedPet = nextPets[currentPetIndex];

      if (!selectedPet) {
        return prevPets;
      }

      const nextLiked = !selectedPet.liked;
      const nextLikes = nextLiked ? selectedPet.likes + 1 : Math.max(0, selectedPet.likes - 1);

      nextPets[currentPetIndex] = {
        ...selectedPet,
        liked: nextLiked,
        likes: nextLikes,
      };

      return nextPets;
    });
  };

  const goToNextPet = () => {
    if (!pets.length) {
      return;
    }

    setSwipeOffsetX(0);
    setIsDetailsExpanded(false);
    setCurrentPetIndex((prevIndex) => (prevIndex + 1) % pets.length);
  };

  const handleGreenAction = () => {
    handleToggleLike();
  };

  const handleRedAction = () => {
    goToNextPet();
  };

  return (
    <View style={styles.root}>
      <NavBar navigation={navigation} />

      <View style={styles.content} {...screenPanResponder.panHandlers}>
        <PetImageCarousel
          images={currentPet?.images || []}
          onFocusChange={handleFocusChange}
          onSwipeRight={handleRedAction}
          onSwipeLeft={handleGreenAction}
          onSwipeProgress={setSwipeOffsetX}
        >
          {!isImageFocused && (
            <PetInfoOverlay
              pet={currentPet}
              onToggleDetails={handleToggleDetails}
              liked={Boolean(currentPet?.liked)}
              likesCount={Number(currentPet?.likes) || 0}
              onToggleLike={handleToggleLike}
            />
          )}
        </PetImageCarousel>

        <PetExpandedOverlay
          visible={!isImageFocused && isDetailsExpanded}
          pet={currentPet}
          liked={Boolean(currentPet?.liked)}
          likesCount={Number(currentPet?.likes) || 0}
          onToggleLike={handleToggleLike}
          onClose={handleCloseDetails}
        />

        {!isImageFocused && (
          <PetActionButtons
            onGreenPress={handleGreenAction}
            onRedPress={handleRedAction}
            expanded={isDetailsExpanded}
            swipeOffsetX={swipeOffsetX}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
});

export default PeTinderScreen;
