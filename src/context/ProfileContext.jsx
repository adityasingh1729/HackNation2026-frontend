import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ProfileContext = createContext(null);

const PROFILE_STORAGE_KEY = "agentic_profile";

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  currency: "USD",
};

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const data = JSON.parse(raw);
    return {
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      pincode: data.pincode ?? "",
      country: data.country ?? "",
      currency: (data.currency ?? "USD").toUpperCase(),
    };
  } catch {
    return defaultProfile;
  }
}

function saveProfileToStorage(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (_) {}
}

/**
 * Merge chatbot json_output with user profile: use profile's pincode and currency
 * so /shop gets real values instead of dummy ones from the chat.
 */
export function mergeSpecWithProfile(spec, profile) {
  if (!spec) return spec;
  if (!profile || (!profile.pincode && !profile.currency)) return spec;
  return {
    ...spec,
    delivery_pincode: profile.pincode ? String(profile.pincode).trim() : spec.delivery_pincode,
    budget_currency: profile.currency ? String(profile.currency).toUpperCase() : spec.budget_currency,
  };
}

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setError(null);
    setProfileState(loadProfileFromStorage());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (newProfile) => {
    setError(null);
    const saved = {
      name: String(newProfile.name ?? ""),
      email: String(newProfile.email ?? ""),
      phone: String(newProfile.phone ?? ""),
      address: String(newProfile.address ?? ""),
      city: String(newProfile.city ?? ""),
      state: String(newProfile.state ?? ""),
      pincode: String(newProfile.pincode ?? ""),
      country: String(newProfile.country ?? ""),
      currency: (String(newProfile.currency ?? "USD").toUpperCase()) || "USD",
    };
    saveProfileToStorage(saved);
    setProfileState(saved);
    return true;
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfileState,
        loadProfile,
        saveProfile,
        loading,
        error,
        mergeSpecWithProfile: (spec) => mergeSpecWithProfile(spec, profile),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
