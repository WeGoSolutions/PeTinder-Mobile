import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { NavBar } from '../components/PeTinder/NavBar';
import PetImageCarousel from '../components/PeTinder/PetImageCarousel';
import PetInfoOverlay from '../components/PeTinder/PetInfoOverlay';
import PetActionButtons from '../components/PeTinder/PetActionButtons';
import PetExpandedOverlay from '../components/PeTinder/PetExpandedOverlay';
import NewUserOnboardingGate from '../components/PeTinder/NewUserOnboardingGate';
import api from '../api';
import { getAuthUserId } from '../storage/authSession';

const PET_PROFILES = [
  {
    id: 'fallback-pet',
    name: 'Pet',
    sex: 'M',
    age: '-',
    likes: 0,
    images: [require('../assets/cachorro.png')],
    description: 'Estamos preparando os perfis para você.',
    features: ['Vacinado'],
    tags: [{ label: 'Aguardando', color: '#CDE88D' }],
  },
];

const TAG_COLORS = ['#FF7DAA', '#CDE88D', '#76D1FF', '#F3C677', '#BDA7FF'];

const mapTag = (tag, index) => ({
  label: String(tag),
  color: TAG_COLORS[index % TAG_COLORS.length],
});

const mapImages = (imagens) => {
  if (!Array.isArray(imagens) || !imagens.length) {
    return [require('../assets/cachorro.png')];
  }

  return imagens
    .filter(Boolean)
    .map((image) => {
      if (typeof image === 'string') {
        if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image')) {
          return { uri: image };
        }

        return { uri: `data:image/jpeg;base64,${image}` };
      }

      return image;
    });
};

const mapPetFromApi = (pet) => ({
  id: pet?.id,
  name: pet?.nome || 'Pet',
  sex: pet?.sexo === 'FEMEA' ? 'F' : 'M',
  age: pet?.idade ? `${Math.floor(Number(pet.idade))} Anos` : '-',
  likes: Number(pet?.curtidas) || 0,
  liked: false,
  images: mapImages(pet?.imagens),
  description: pet?.descricao || '',
  features: [
    pet?.isVacinado ? 'Vacinado' : null,
    pet?.isCastrado ? 'Castrado' : null,
    pet?.isVermifugo ? 'Vermífugo' : null,
  ].filter(Boolean),
  tags: Array.isArray(pet?.tags) && pet.tags.length
    ? pet.tags.map(mapTag)
    : [{ label: pet?.porte || 'Sem tag', color: '#CDE88D' }],
});

const PeTinderScreen = ({ navigation, route }) => {
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

  useEffect(() => {
    let isMounted = true;

    const loadPets = async () => {
      try {
        const userId = await getAuthUserId();

        if (!userId) {
          return;
        }

        const response = await api.get(`/status/default/${userId}`);
        const apiList = Array.isArray(response?.data?.content) ? response.data.content : [];

        if (!apiList.length || !isMounted) {
          return;
        }

        const mappedPets = apiList.map(mapPetFromApi);
        setPets(mappedPets);
        setCurrentPetIndex(0);
      } catch (error) {
        console.error('Erro ao buscar pets padrão:', error?.response?.data || error?.message);
      }
    };

    loadPets();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleToggleLike = async () => {
    const selectedPet = pets[currentPetIndex];

    if (!selectedPet?.id) {
      return;
    }

    try {
      const userId = await getAuthUserId();

      if (!userId) {
        return;
      }

      const body = {
        petId: selectedPet.id,
        userId,
        status: 'LIKED',
      };

      console.log('Enviando like para API:', body);

      await api.post('/status', {
        petId: selectedPet.id,
        userId: userId,
        status: 'LIKED',
      });

      setPets((prevPets) => {
        const nextPets = [...prevPets];
        const pet = nextPets[currentPetIndex];

        if (!pet) {
          return prevPets;
        }

        nextPets[currentPetIndex] = {
          ...pet,
          liked: !pet.liked,
        };

        return nextPets;
      });

      goToNextPet();
    } catch (error) {
      console.error('Erro ao curtir pet:', error?.response?.data || error?.message);
    }
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

      <NewUserOnboardingGate navigation={navigation} route={route} />
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
