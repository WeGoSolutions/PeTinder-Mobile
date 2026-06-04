import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Espaço mínimo entre o topo da folha e o topo da área segura, para a folha
// nunca encostar na status bar / notch.
const TOP_GAP = 12;
// Respiro inferior base do conteúdo (somado ao inset da barra de gestos).
const BASE_BOTTOM_PADDING = 16;

const BottomSheet = ({
  children,
  title,
  showBackButton = false,
  onBack,
  keyboardHeight = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Altura máxima da folha: o que sobra acima do teclado (quando aberto) ou da
  // área segura. Com isso a folha NUNCA é empurrada para fora da tela como um
  // bloco rígido — em vez disso o conteúdo rola por dentro. Comportamento
  // idêntico em iOS e Android (calculado em JS, sem depender do SO).
  const maxHeight = windowHeight - insets.top - TOP_GAP - keyboardHeight;

  // Respiro inferior SEMPRE inclui o inset da área segura (barra de gestos/home
  // indicator). Isso resolve dois casos: (1) com teclado fechado, os botões não
  // ficam sob a barra de gestos; (2) com teclado aberto, sobe a viewport de
  // rolagem acima do teclado — no Android edge-to-edge a altura medida do
  // teclado não inclui a barra de navegação, então sem isso o último item (ex.:
  // "Esqueceu a senha") ficava escondido atrás do teclado.
  const bottomPadding = Math.max(BASE_BOTTOM_PADDING + insets.bottom, 24);

  return (
    <View
      style={[
        styles.actionSheetContainer,
        { maxHeight, paddingBottom: bottomPadding },
      ]}
    >
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionSheetContainer: {
    zIndex: 10,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    width: '100%',
    overflow: 'hidden',
  },
  scroll: {
    // flexShrink permite a rolagem encolher para caber no maxHeight quando o
    // formulário é mais alto que o espaço disponível (ex.: cadastro + teclado).
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default BottomSheet;
