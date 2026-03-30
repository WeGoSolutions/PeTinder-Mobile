import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Image,
	TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CustomHeader } from '../components/CustomHeader';
import api from '../api';
import { getAuthUserId } from '../storage/authSession';

const FALLBACK_PET_IMAGE = require('../assets/cachorro.png');

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

const mapLikedPet = (item) => ({
	id: String(item?.petId || ''),
	name: item?.petNome || 'Pet',
	imageUri: normalizeImageUri(item?.imageUrl),
});

const LikedScreen = ({ navigation }) => {
	const route = useRoute();
	const title = route.params?.title || 'Curtidos';
	const [likedPets, setLikedPets] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [fetchError, setFetchError] = useState('');

	useEffect(() => {
		let isMounted = true;

		const loadLikedPets = async () => {
			try {
				setIsLoading(true);
				setFetchError('');

				const userId = await getAuthUserId();

				if (!userId) {
					if (isMounted) {
						setFetchError('Usuário não encontrado na sessão.');
					}
					return;
				}

				const response = await api.get(`/status/${userId}/LIKED`);
				const list = Array.isArray(response?.data) ? response.data : [];
				const mapped = list
					.map(mapLikedPet)
					.filter((item) => Boolean(item.id));

				if (isMounted) {
					setLikedPets(mapped);
				}
			} catch (error) {
				if (isMounted) {
					const errorMsg =
						error?.response?.data?.message
						|| error?.message
						|| 'Não foi possível carregar os pets curtidos.';
					setFetchError(errorMsg);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadLikedPets();

		return () => {
			isMounted = false;
		};
	}, []);

	const likedCountLabel = useMemo(() => {
		const count = likedPets.length;
		return count === 1 ? '1 pet curtido' : `${count} pets curtidos`;
	}, [likedPets.length]);

	const renderItem = ({ item }) => (
		<TouchableOpacity
			activeOpacity={0.85}
			style={styles.card}
			onPress={() => navigation.navigate('PeTinder', { focusPetId: item.id })}
		>
			<Image source={item.imageUri ? { uri: item.imageUri } : FALLBACK_PET_IMAGE} style={styles.cardImage} />

			<View style={styles.cardContent}>
				<Text style={styles.cardName}>{item.name}</Text>
				<Text style={styles.cardMeta}>Curtido</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.root}>
			<CustomHeader onBack={() => navigation.goBack()} title={title} />

			<View style={styles.content}>
				<Text style={styles.heading}>Seus likes</Text>
				<Text style={styles.subtitle}>{likedCountLabel}</Text>

				{isLoading && <Text style={styles.infoText}>Carregando pets curtidos...</Text>}
				{Boolean(fetchError) && <Text style={styles.errorText}>{fetchError}</Text>}

				<FlatList
					data={likedPets}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyTitle}>Nenhum pet curtido ainda</Text>
							<Text style={styles.emptyText}>
								Continue explorando para salvar seus favoritos aqui.
							</Text>
						</View>
					}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#1A1A1A',
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	heading: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 26,
		color: '#FFFFFF',
	},
	subtitle: {
		marginTop: 4,
		marginBottom: 14,
		fontFamily: 'Poppins_400Regular',
		fontSize: 13,
		color: '#CFCFCF',
	},
	listContent: {
		gap: 12,
		paddingBottom: 24,
	},
	infoText: {
		marginBottom: 10,
		fontFamily: 'Poppins_400Regular',
		fontSize: 13,
		color: '#CFCFCF',
	},
	errorText: {
		marginBottom: 10,
		fontFamily: 'Poppins_500Medium',
		fontSize: 13,
		color: '#FF7F7F',
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#252525',
		borderRadius: 14,
		padding: 10,
	},
	cardImage: {
		width: 68,
		height: 68,
		borderRadius: 12,
		backgroundColor: '#2E2E2E',
	},
	cardContent: {
		marginLeft: 12,
		flex: 1,
	},
	cardName: {
		fontFamily: 'Poppins_600SemiBold',
		fontSize: 16,
		color: '#FFFFFF',
	},
	cardMeta: {
		marginTop: 2,
		fontFamily: 'Poppins_400Regular',
		fontSize: 13,
		color: '#D4D4D4',
	},
	cardLocation: {
		marginTop: 2,
		fontFamily: 'Poppins_400Regular',
		fontSize: 12,
		color: '#AFAFAF',
	},
	emptyState: {
		marginTop: 60,
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	emptyTitle: {
		fontFamily: 'Poppins_600SemiBold',
		fontSize: 18,
		color: '#FFFFFF',
		textAlign: 'center',
	},
	emptyText: {
		marginTop: 8,
		fontFamily: 'Poppins_400Regular',
		fontSize: 13,
		color: '#C9C9C9',
		textAlign: 'center',
	},
});

export default LikedScreen;
