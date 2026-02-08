import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";

const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};

const defaultProfile = { name: "", address: "", pincode: "", currency: "USD" };

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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api.profile);
      if (res.ok) {
        const data = await res.json();
        setProfileState({
          name: data.name ?? "",
          address: data.address ?? "",
          pincode: data.pincode ?? "",
          currency: data.currency ?? "USD",
        });
      }
    } catch (err) {
      setError(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (newProfile) => {
    setError(null);
    try {
      const res = await fetch(api.profile, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setProfileState({
        name: data.name ?? "",
        address: data.address ?? "",
        pincode: data.pincode ?? "",
        currency: data.currency ?? "USD",
      });
      return true;
    } catch (err) {
      setError(err.message || "Could not save profile");
      return false;
    }
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
