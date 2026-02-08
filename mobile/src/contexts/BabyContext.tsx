import React, { createContext, useState, useContext, useEffect } from 'react';
import { Baby, babyService } from '../services/babyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BabyContextType {
  babies: Baby[];
  currentBaby: Baby | null;
  isLoading: boolean;
  setCurrentBaby: (baby: Baby | null) => void;
  refreshBabies: () => Promise<void>;
  addBaby: (baby: Baby) => void;
  updateBaby: (baby: Baby) => void;
  removeBaby: (babyId: string) => void;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export const BabyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [currentBaby, setCurrentBabyState] = useState<Baby | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBabies();
  }, []);

  const loadBabies = async () => {
    try {
      const fetchedBabies = await babyService.getBabies();
      setBabies(fetchedBabies);

      const savedBabyId = await AsyncStorage.getItem('currentBabyId');
      if (savedBabyId) {
        const baby = fetchedBabies.find((b) => b._id === savedBabyId);
        if (baby) {
          setCurrentBabyState(baby);
        } else if (fetchedBabies.length > 0) {
          setCurrentBabyState(fetchedBabies[0]);
        }
      } else if (fetchedBabies.length > 0) {
        setCurrentBabyState(fetchedBabies[0]);
      }
    } catch (error) {
      console.error('Error loading babies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentBaby = async (baby: Baby | null) => {
    setCurrentBabyState(baby);
    if (baby) {
      await AsyncStorage.setItem('currentBabyId', baby._id);
    } else {
      await AsyncStorage.removeItem('currentBabyId');
    }
  };

  const refreshBabies = async () => {
    setIsLoading(true);
    await loadBabies();
  };

  const addBaby = (baby: Baby) => {
    setBabies((prev) => [...prev, baby]);
  };

  const updateBaby = (baby: Baby) => {
    setBabies((prev) => prev.map((b) => (b._id === baby._id ? baby : b)));
    if (currentBaby?._id === baby._id) {
      setCurrentBabyState(baby);
    }
  };

  const removeBaby = (babyId: string) => {
    setBabies((prev) => prev.filter((b) => b._id !== babyId));
    if (currentBaby?._id === babyId) {
      setCurrentBabyState(babies[0] || null);
    }
  };

  return (
    <BabyContext.Provider
      value={{
        babies,
        currentBaby,
        isLoading,
        setCurrentBaby,
        refreshBabies,
        addBaby,
        updateBaby,
        removeBaby,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
};

export const useBaby = () => {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within BabyProvider');
  }
  return context;
};
