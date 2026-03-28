import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_SESSION_KEY = "@petinder/auth_session";

export const saveAuthSession = async ({ id, token, email, nome, userNovo }) => {
  const session = {
    id: id || null,
    token: token || null,
    email: email || null,
    nome: nome || null,
    userNovo: Boolean(userNovo),
    updatedAt: Date.now(),
  };

  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getAuthSession = async () => {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
};

export const getAuthUserId = async () => {
  const session = await getAuthSession();
  return session?.id || null;
};

export const getAuthToken = async () => {
  const session = await getAuthSession();
  return session?.token || null;
};

export const clearAuthSession = async () => {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
};
