import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../config/api';

const BabyContext = createContext();

export function useBaby() {
  return useContext(BabyContext);
}

export function BabyProvider({ children }) {
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBabies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/babies');
      const allBabies = [...response.data.owned, ...response.data.shared];
      setBabies(allBabies);
      
      if (allBabies.length > 0 && !selectedBaby) {
        setSelectedBaby(allBabies[0]);
      }
    } catch (error) {
      console.error('Error fetching babies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBaby = async (babyData) => {
    try {
      const response = await api.post('/babies', babyData);
      await fetchBabies();
      return { success: true, baby: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al agregar bebé' 
      };
    }
  };

  const updateBaby = async (babyId, babyData) => {
    try {
      const response = await api.put(`/babies/${babyId}`, babyData);
      await fetchBabies();
      return { success: true, baby: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al actualizar bebé' 
      };
    }
  };

  const deleteBaby = async (babyId) => {
    try {
      await api.delete(`/babies/${babyId}`);
      await fetchBabies();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al eliminar bebé' 
      };
    }
  };

  useEffect(() => {
    fetchBabies();
  }, []);

  const value = {
    babies,
    selectedBaby,
    setSelectedBaby,
    loading,
    fetchBabies,
    addBaby,
    updateBaby,
    deleteBaby,
  };

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
}
