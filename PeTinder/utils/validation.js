// Validações do cadastro do usuário.
//
// As regras aqui espelham EXATAMENTE as do backend (CriarUsuarioWebDTO.java +
// regra de domínio de idade em Usuario.java), para que o cliente e o servidor
// concordem e o usuário receba a mensagem certa antes de enviar o formulário.
//
// Cada validador retorna uma string de erro (a mesma mensagem do backend) ou
// "" quando o campo está válido.

// Regex espelhando o DTO do backend
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/; // apenas letras (com acento) e espaços
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Complexidade da senha: checagens separadas (mais legível que um único lookahead)
const PWD_UPPER = /[A-Z]/;
const PWD_LOWER = /[a-z]/;
const PWD_DIGIT = /[0-9]/;
const PWD_SPECIAL = /[!@#$%^&*(),.?":{}|<>]/;

const MIN_AGE = 21;

// Texto de ajuda fixo exibido abaixo de cada campo (como preencher).
export const HELPER_TEXT = {
  fullName: "Apenas letras e espaços, mínimo 3 caracteres.",
  email: "Use um email válido, ex.: nome@exemplo.com.",
  password:
    "Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo (!@#$...).",
  confirmPassword: "Repita exatamente a senha digitada acima.",
  birthDate: "Você deve ter no mínimo 21 anos.",
};

// Mapeia as chaves de erro do backend para as chaves de erro do formulário.
export const BACKEND_FIELD_MAP = {
  nome: "fullName",
  email: "email",
  senha: "password",
  dataNascimento: "birthDate",
};

export const validateFullName = (value) => {
  const trimmed = (value || "").trim();

  if (!trimmed) {
    return "Nome é obrigatório";
  }

  if (trimmed.length < 3) {
    return "Nome deve ter pelo menos 3 caracteres";
  }

  if (!NAME_REGEX.test(trimmed)) {
    return "Nome deve conter apenas letras e espaços";
  }

  return "";
};

export const validateEmail = (value) => {
  const trimmed = (value || "").trim();

  if (!trimmed) {
    return "Email é obrigatório";
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return "Email deve ter formato válido";
  }

  return "";
};

export const validatePassword = (value) => {
  // Não dar trim: espaços são caracteres válidos e o backend não remove.
  if (!value) {
    return "Senha é obrigatória";
  }

  if (value.length < 8) {
    return "Senha deve ter pelo menos 8 caracteres";
  }

  if (
    !PWD_UPPER.test(value) ||
    !PWD_LOWER.test(value) ||
    !PWD_DIGIT.test(value) ||
    !PWD_SPECIAL.test(value)
  ) {
    return "Senha deve conter pelo menos: uma letra maiúscula, uma minúscula, um número e um caractere especial";
  }

  return "";
};

// Lista de requisitos da senha com o status (atendido ou não) para o valor
// atual. Usada para o checklist dinâmico que se completa enquanto o usuário
// digita. Reaproveita EXATAMENTE as mesmas regras de validatePassword, então
// há uma única fonte de verdade.
export const getPasswordRequirements = (value = "") => [
  { key: "length", label: "Mínimo de 8 caracteres", met: value.length >= 8 },
  { key: "upper", label: "Uma letra maiúscula", met: PWD_UPPER.test(value) },
  { key: "lower", label: "Uma letra minúscula", met: PWD_LOWER.test(value) },
  { key: "digit", label: "Um número", met: PWD_DIGIT.test(value) },
  {
    key: "special",
    label: "Um caractere especial (!@#$...)",
    met: PWD_SPECIAL.test(value),
  },
];

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) {
    return "Confirme a senha";
  }

  if (confirm !== password) {
    return "As senhas não coincidem";
  }

  return "";
};

// Calcula a idade em anos completos (diferença de anos com ajuste de mês/dia),
// para a mensagem casar com a do backend ("Idade atual: X").
export const calculateAge = (dateValue) => {
  const dob = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
};

export const validateBirthDate = (dateValue) => {
  if (!dateValue) {
    return "Data de nascimento é obrigatória";
  }

  const parsedDate =
    dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data de nascimento inválida";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate >= today) {
    return "Data de nascimento deve ser no passado";
  }

  const age = calculateAge(dateValue);
  if (age !== null && age < MIN_AGE) {
    return `Usuário deve ter mais de ${MIN_AGE} anos. Idade atual: ${age}`;
  }

  return "";
};

// Converte o objeto validationErrors do backend (keyed por nome/email/senha/
// dataNascimento) num objeto parcial de registerErrors (keyed por fullName/
// email/password/birthDate). Chaves desconhecidas são ignoradas.
export const mapBackendValidationErrors = (validationErrors) => {
  const mapped = {};

  if (!validationErrors || typeof validationErrors !== "object") {
    return mapped;
  }

  Object.keys(validationErrors).forEach((backendKey) => {
    const formKey = BACKEND_FIELD_MAP[backendKey];
    if (formKey) {
      mapped[formKey] = validationErrors[backendKey];
    }
  });

  return mapped;
};

export default {
  HELPER_TEXT,
  BACKEND_FIELD_MAP,
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateBirthDate,
  calculateAge,
  mapBackendValidationErrors,
  getPasswordRequirements,
};
