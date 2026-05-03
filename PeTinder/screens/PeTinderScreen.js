import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Text,
  Animated,
  Easing,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavBar } from '../components/PeTinder/NavBar';
import PetImageCarousel from '../components/PeTinder/PetImageCarousel';
import PetInfoOverlay from '../components/PeTinder/PetInfoOverlay';
import PetActionButtons from '../components/PeTinder/PetActionButtons';
import PetExpandedOverlay from '../components/PeTinder/PetExpandedOverlay';
import NewUserOnboardingGate from '../components/PeTinder/NewUserOnboardingGate';
import { CustomHeader } from '../components/CustomHeader';
import Toast from '../components/Toast';
import api from '../api';
import { getAuthUserId } from '../storage/authSession';

const TAG_COLORS = ['#FF7DAA', '#CDE88D', '#76D1FF', '#F3C677', '#BDA7FF'];

const mapTag = (tag, index) => ({
  label: String(tag),
  color: TAG_COLORS[index % TAG_COLORS.length],
});

const getApiHost = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const host = apiUrl.replace(/^https?:\/\//, '').split('/')[0];
  return host || null;
};

const normalizeImageUri = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }

  if (
    imageUrl.startsWith('http://localhost')
    || imageUrl.startsWith('https://localhost')
    || imageUrl.startsWith('http://127.0.0.1')
    || imageUrl.startsWith('https://127.0.0.1')
  ) {
    const apiHost = getApiHost();

    if (!apiHost) {
      return imageUrl;
    }

    return imageUrl
      .replace(/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i, `http://${apiHost}`)
      .replace(/^https:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i, `https://${apiHost}`);
  }

  return imageUrl;
};

const mapImages = (imagens) => {
  if (!Array.isArray(imagens) || !imagens.length) {
    return [require('../assets/cachorro.png')];
  }

  return imagens
    .filter(Boolean)
    .map((image) => {
      if (typeof image === 'string') {
        const normalizedImage = normalizeImageUri(image);

        if (!normalizedImage) {
          return require('../assets/cachorro.png');
        }

        if (
          normalizedImage.startsWith('http://')
          || normalizedImage.startsWith('https://')
          || normalizedImage.startsWith('data:image')
        ) {
          return { uri: normalizedImage };
        }

        return { uri: `data:image/jpeg;base64,${normalizedImage}` };
      }

      return image;
    });
};

const formatPetAge = (ageValue) => {
  const numericAge = Number(ageValue);

  if (!Number.isFinite(numericAge) || numericAge <= 0) {
    return '-';
  }

  if (numericAge < 1) {
    const months = Math.max(1, Math.round(numericAge * 12));
    return `${months} ${months === 1 ? 'Mês' : 'Meses'}`;
  }

  const years = Math.floor(numericAge);
  return `${years} ${years === 1 ? 'Ano' : 'Anos'}`;
};

const loadPetImages = async (petId) => {
  if (!petId) {
    return [require('../assets/cachorro.png')];
  }

  try {
    const response = await api.get(`/pets/${petId}/imagens`);
    const imageList = Array.isArray(response?.data) ? response.data : [];

    return mapImages(imageList);
  } catch (error) {
    console.error(`Erro ao buscar imagens do pet ${petId}:`, error?.response?.data || error?.message);
    return [require('../assets/cachorro.png')];
  }
};

const hydratePetsWithImages = async (petList) => {
  const hydratedPets = await Promise.all(
    petList.map(async (pet) => {
      const images = await loadPetImages(pet?.id);

      return {
        ...pet,
        images,
      };
    }),
  );

  return hydratedPets;
};

const mapPetFromApi = (pet) => ({
  id: pet?.id,
  name: pet?.nome || 'Pet',
  sex: pet?.sexo === 'FEMEA' ? 'F' : 'M',
  age: formatPetAge(pet?.idade),
  likes: Number(pet?.curtidas) || 0,
  liked: false,
  images: mapImages(pet?.imagens || pet?.imagensUrls),
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
  const [pets, setPets] = useState([]);
  const [defaultPets, setDefaultPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [isImageFocused, setIsImageFocused] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const [isFocusedLikedPet, setIsFocusedLikedPet] = useState(false);
  const focusPetId = String(route?.params?.focusPetId || '');
  const isReadOnlyPreview = Boolean(route?.params?.readOnlyPreview);
  const previewTitle = String(route?.params?.previewTitle || '');
  const [isPreviewMenuVisible, setIsPreviewMenuVisible] = useState(false);
  const [isRemovingInterest, setIsRemovingInterest] = useState(false);
  const [isConfirmingRemoveInterest, setIsConfirmingRemoveInterest] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: 'error',
    message: '',
  });
  const hasOpenedBySwipe = useRef(false);
  const isImageFocusedRef = useRef(isImageFocused);
  const isDetailsExpandedRef = useRef(isDetailsExpanded);
  const shimmerTranslateX = useRef(new Animated.Value(-220)).current;
  const currentPet = pets[currentPetIndex] || null;
  const hasPets = pets.length > 0;

  isImageFocusedRef.current = isImageFocused;
  isDetailsExpandedRef.current = isDetailsExpanded;

  const loadDefaultPets = useCallback(async () => {
    const userId = await getAuthUserId();

    if (!userId) {
      return [];
    }

    const response = await api.get(`/status/default/${userId}`);
    const apiList = Array.isArray(response?.data?.content) ? response.data.content : [];

    if (!apiList.length) {
      return [];
    }

    const mappedPets = apiList.map(mapPetFromApi);
    return hydratePetsWithImages(mappedPets);
  }, []);

  const loadFocusedPet = useCallback(async (petId) => {
    if (!petId) {
      return null;
    }

    const response = await api.get(`/pets/${petId}`);
    const mappedPet = mapPetFromApi(response?.data || {});
    const focusedPetImages = await loadPetImages(petId);

    if (!mappedPet?.id) {
      return null;
    }

    return {
      ...mappedPet,
      images: focusedPetImages,
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchPetsOnFocus = async () => {
        try {
          setIsLoadingPets(true);

          const hydratedDefaultPets = await loadDefaultPets();

          if (!isActive) {
            return;
          }

          setDefaultPets(hydratedDefaultPets);

          if (focusPetId) {
            const focusedPet = await loadFocusedPet(focusPetId);

            if (!isActive) {
              return;
            }

            if (focusedPet) {
              setPets([focusedPet]);
              setCurrentPetIndex(0);
              setIsFocusedLikedPet(true);
              setIsDetailsExpanded(false);
              setSwipeOffsetX(0);
            } else {
              setPets(hydratedDefaultPets);
              setCurrentPetIndex(0);
              setIsFocusedLikedPet(false);
            }
          } else {
            setPets(hydratedDefaultPets);
            setCurrentPetIndex(0);
            setIsFocusedLikedPet(false);
          }
        } catch (error) {
          console.error('Erro ao buscar pets na tela PeTinder:', error?.response?.data || error?.message);

          if (isActive) {
            setPets([]);
            setDefaultPets([]);
            setIsFocusedLikedPet(false);
          }
        } finally {
          if (isActive) {
            setIsLoadingPets(false);
          }
        }
      };

      fetchPetsOnFocus();

      return () => {
        isActive = false;
      };
    }, [focusPetId, loadDefaultPets, loadFocusedPet]),
  );

  useEffect(() => {
    if (!isLoadingPets) {
      return undefined;
    }

    shimmerTranslateX.setValue(-220);

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: 460,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [isLoadingPets, shimmerTranslateX]);

  const restoreDefaultPetList = () => {
    setIsFocusedLikedPet(false);

    if (defaultPets.length) {
      setPets(defaultPets);
      setCurrentPetIndex(0);
    }

    setIsDetailsExpanded(false);
    setSwipeOffsetX(0);
    navigation.setParams({ focusPetId: undefined });
  };

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
    if (isReadOnlyPreview) {
      return;
    }

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

  const handleGreenAction = async () => {
    if (isReadOnlyPreview) {
      return;
    }

    const selectedPet = pets[currentPetIndex];

    if (!selectedPet?.id) {
      return;
    }

    try {
      const userId = await getAuthUserId();

      if (!userId) {
        return;
      }

      await api.post(`/status/pending/${selectedPet.id}/${userId}`);
      navigation.navigate('Chat', { title: 'Chat' });
    } catch (error) {
      console.error('Erro ao criar pendencia de chat:', error?.response?.data || error?.message);
    }
  };

  const handleRedAction = () => {
    if (isReadOnlyPreview) {
      return;
    }

    if (isFocusedLikedPet) {
      restoreDefaultPetList();
      return;
    }

    goToNextPet();
  };

  const handleOverlayLikeAction = isFocusedLikedPet
    ? handleGreenAction
    : handleToggleLike;

  useEffect(() => {
    if (!toast.visible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);

    return () => clearTimeout(timeoutId);
  }, [toast.visible]);

  const handleOpenPreviewMenu = () => {
    if (isRemovingInterest) {
      return;
    }

    setIsPreviewMenuVisible(true);
  };

  const handleClosePreviewMenu = () => {
    if (isRemovingInterest) {
      return;
    }

    setIsPreviewMenuVisible(false);
  };

  const handleRemoveInterest = () => {
    const selectedPetId = String(currentPet?.id || focusPetId || '');

    if (!selectedPetId) {
      return;
    }

    setIsConfirmingRemoveInterest(true);
    setIsPreviewMenuVisible(false);
  };

  const confirmRemoveInterest = async () => {
    const selectedPetId = String(currentPet?.id || focusPetId || '');

    if (!selectedPetId || isRemovingInterest) {
      return;
    }

    try {
      setIsRemovingInterest(true);
      const userId = await getAuthUserId();

      if (!userId) {
        throw new Error('Usuário sem sessão.');
      }

      await api.delete(`/status/${selectedPetId}/${userId}`);
      setIsConfirmingRemoveInterest(false);

      const successParams = {
        title: 'Chat',
        toastType: 'success',
        toastMessage: 'Interesse removido com sucesso!',
      };

      if (typeof navigation.popTo === 'function') {
        navigation.popTo('Chat', successParams);
      } else {
        navigation.navigate('Chat', successParams);
      }
    } catch (error) {
      console.error('Erro ao remover interesse:', error?.response?.data || error?.message);
      setToast({
        visible: true,
        type: 'error',
        message: 'Erro ao remover interesse!',
      });
      setIsConfirmingRemoveInterest(false);
    } finally {
      setIsRemovingInterest(false);
    }
  };

  const cancelRemoveInterest = () => {
    if (isRemovingInterest) {
      return;
    }

    setIsConfirmingRemoveInterest(false);
  };

  return (
    <View style={styles.root}>
      {isReadOnlyPreview ? (
        <CustomHeader
          onBack={() => navigation.goBack()}
          title={previewTitle || currentPet?.name || 'Pet'}
          onRightPress={handleOpenPreviewMenu}
          rightIconName="more-vert"
          isRightLoading={isRemovingInterest}
        />
      ) : (
        <NavBar navigation={navigation} />
      )}

      <View style={styles.content} {...(hasPets ? screenPanResponder.panHandlers : {})}>
        {isLoadingPets ? (
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonImageBlock}>
              <Animated.View
                style={[
                  styles.skeletonShimmer,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.skeletonShimmerGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.skeletonInfoPanel}>
              <View style={styles.skeletonTitleLine} />
              <View style={styles.skeletonSubtitleLine} />
              <View style={styles.skeletonTagRow}>
                <View style={styles.skeletonTag} />
                <View style={styles.skeletonTag} />
              </View>
            </View>
            <View style={styles.skeletonActionsRow}>
              <View style={styles.skeletonActionButton} />
              <View style={styles.skeletonActionButton} />
            </View>
          </View>
        ) : hasPets ? (
          <>
            <PetImageCarousel
              images={currentPet?.images || []}
              onFocusChange={handleFocusChange}
              onSwipeRight={isReadOnlyPreview ? undefined : handleRedAction}
              onSwipeLeft={isReadOnlyPreview ? undefined : handleGreenAction}
              onSwipeProgress={isReadOnlyPreview ? undefined : setSwipeOffsetX}
              swipeEnabled={!isReadOnlyPreview}
            >
              {!isImageFocused && (
                <PetInfoOverlay
                  pet={currentPet}
                  onToggleDetails={handleToggleDetails}
                  liked={Boolean(currentPet?.liked)}
                  likesCount={Number(currentPet?.likes) || 0}
                  onToggleLike={isReadOnlyPreview ? undefined : handleOverlayLikeAction}
                />
              )}
            </PetImageCarousel>

            <PetExpandedOverlay
              visible={!isImageFocused && isDetailsExpanded}
              pet={currentPet}
              liked={Boolean(currentPet?.liked)}
              likesCount={Number(currentPet?.likes) || 0}
              onToggleLike={isReadOnlyPreview ? undefined : handleOverlayLikeAction}
              onClose={handleCloseDetails}
            />

            {!isImageFocused && !isReadOnlyPreview && (
              <PetActionButtons
                onGreenPress={handleGreenAction}
                onRedPress={handleRedAction}
                expanded={isDetailsExpanded}
                swipeOffsetX={swipeOffsetX}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum pet disponível</Text>
            <Text style={styles.emptySubtitle}>No momento não há pets para exibir.</Text>
          </View>
        )}
      </View>

      <NewUserOnboardingGate navigation={navigation} route={route} />

      <Modal
        transparent
        visible={isPreviewMenuVisible}
        animationType="fade"
        onRequestClose={handleClosePreviewMenu}
      >
        <Pressable style={styles.previewMenuBackdrop} onPress={handleClosePreviewMenu}>
          <Pressable style={styles.previewMenuContent} onPress={() => {}}>
            <Pressable
              style={styles.previewMenuItem}
              onPress={handleRemoveInterest}
              disabled={isRemovingInterest}
            >
              {isRemovingInterest ? (
                <View style={styles.previewMenuLoadingRow}>
                  <ActivityIndicator size="small" color="#FF6B6B" />
                  <Text style={styles.previewMenuItemText}>Removendo...</Text>
                </View>
              ) : (
                <Text style={styles.previewMenuItemText}>Não tenho interesse</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={isConfirmingRemoveInterest}
        animationType="fade"
        onRequestClose={cancelRemoveInterest}
      >
        <Pressable style={styles.confirmationModalBackdrop} onPress={cancelRemoveInterest}>
          <Pressable style={styles.confirmationModalContent} onPress={() => {}}>
            <Text style={styles.confirmationModalTitle}>Remover interesse?</Text>
            <Text style={styles.confirmationModalMessage}>
              Essa ação irá remover o interesse. Tem certeza?
            </Text>
            <View style={styles.confirmationModalButtons}>
              <Pressable
                style={[styles.confirmationButton, styles.confirmationCancelButton]}
                onPress={cancelRemoveInterest}
                disabled={isRemovingInterest}
              >
                <Text style={styles.confirmationCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmationButton, styles.confirmationConfirmButton]}
                onPress={confirmRemoveInterest}
                disabled={isRemovingInterest}
              >
                {isRemovingInterest ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmationConfirmText}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
      />
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
  previewMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'flex-end',
    paddingTop: 92,
    paddingRight: 14,
  },
  previewMenuContent: {
    minWidth: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  previewMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewMenuItemText: {
    color: '#FF4D4F',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  previewMenuLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmationModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  confirmationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  confirmationModalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmationCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmationConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
  confirmationConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 10,
    color: '#CFCFCF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  skeletonImageBlock: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#222222',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
  },
  skeletonShimmerGradient: {
    flex: 1,
  },
  skeletonInfoPanel: {
    marginTop: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#181818',
  },
  skeletonTitleLine: {
    height: 20,
    width: '58%',
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  skeletonSubtitleLine: {
    marginTop: 10,
    height: 14,
    width: '36%',
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  skeletonTagRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  skeletonTag: {
    height: 28,
    width: 90,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
  },
  skeletonActionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  skeletonActionButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2A2A2A',
  },
});

export default PeTinderScreen;
