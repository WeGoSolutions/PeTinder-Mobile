import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import * as Location from 'expo-location';
import { getAuthUserId } from '../storage/authSession';
import api from '../api';

const GeolocalizationScreen = () => {

    const [location, setLocation] = useState(null);
    const [endereco, setEndereco] = useState(null);
    const [coordsEndereco, setCoordsEndereco] = useState(null);
    const [distancia, setDistancia] = useState(null);

    useEffect(() => {
        getCurrentLocation();
        fetchData();
    }, []);

    useEffect(() => {
        if (location && coordsEndereco) {
            calcularDistanciaRota(
                location.coords.latitude,
                location.coords.longitude,
                coordsEndereco.latitude,
                coordsEndereco.longitude
            );
        }
    }, [location, coordsEndereco]);

    async function getCurrentLocation() {
        try {

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') return;

            const currentLocation = await Location.getCurrentPositionAsync({});

            setLocation(currentLocation);

        } catch (error) {
            console.log('Erro ao pegar localização atual:', error);
        }
    }

    async function fetchData() {
        try {

            const userId = await getAuthUserId();

            if (!userId) return;

            const response = await api.get(`/status/default/${userId}`);

            const enderecoApi = response.data.content[0].endereco;

            setEndereco(enderecoApi);

            const coords = await getCoordinates(enderecoApi);

            setCoordsEndereco(coords);

        } catch (error) {
            console.log('Erro:', error);
        }
    }

    async function calcularDistanciaRota(latUser, lonUser, latOng, lonOng) {
        try {

            const url = `https://router.project-osrm.org/route/v1/driving/${lonUser},${latUser};${lonOng},${latOng}?overview=false`;

            const response = await fetch(url);

            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {

                const km = (data.routes[0].distance / 1000).toFixed(1);

                setDistancia(km);
            }

        } catch (error) {
            console.log('Erro ao calcular distância:', error);
        }
    }

    return (
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{distancia ? `A ${distancia} Km de distância` : '...'}</Text>
    );
};

const getCoordinates = async (endereco) => {
    try {

        const query = `${endereco.rua}, ${endereco.numero}, ${endereco.cidade}, ${endereco.uf}, ${endereco.cep}, Brasil`;

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ReactNativeApp'
            }
        });

        const data = JSON.parse(await response.text());

        if (data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }

        return null;

    } catch (error) {
        console.log('Erro ao buscar coordenadas:', error);
        return null;
    }
};

export default GeolocalizationScreen;