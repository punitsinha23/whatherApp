import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [location, setLocation] = useState(null);
  const [search, setSearchTerm] = useState('');
  const [data, setData] = useState(null);
  const [isDay, setIsDay] = useState(true);
  const [city, setCity] = useState([]);
  const [ loading , setLoading ] = useState(true);

  const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Moscow', 'Delhi', 'Beijing', 'Sydney', 'São Paulo', 'Cairo'];

  const FetchData = async (searchTerm) => {
    if (!searchTerm.trim()) {
      Alert.alert('Input Error', 'Please enter a location.');
      return;
    }

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm}`);
      const locationData = await res.json();

      if (!locationData.results || locationData.results.length === 0) {
        Alert.alert('Location Not Found', 'Please enter a valid location.');
        setData(null);
        return;
      }

      setLocation(locationData);

      const { latitude, longitude } = locationData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
      );
      const weatherData = await weatherRes.json();
      setData(weatherData);

      const time = weatherData.current.time;
      const hour = time.slice(11, 16);
      const intHour = parseInt(hour);
      setIsDay(intHour >= 6 && intHour < 18);

      await AsyncStorage.setItem('lastCity', searchTerm);

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Network Error', 'Failed to fetch data.');
    }
  };

  useEffect(() => {
    const fetchCityData = async () => {
      const result = [];

      for (const city of cities) {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
          const data = await res.json();

          if (!data.results || data.results.length === 0) continue;

          const { latitude, longitude } = data.results[0];
          const cityRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
          );
          const cityData = await cityRes.json();

          result.push({
            city,
            temperature: cityData.current.temperature_2m,
          });
        } catch (error) {
          console.error(`Error fetching weather for ${city}:`, error);
        }
      }

      setCity(result);
      setLoading(false);
    };

    const loadLastCity = async () => {
      try {
        const lastCity = await AsyncStorage.getItem('lastCity');
        if (lastCity) {
          setSearchTerm(lastCity);
          FetchData(lastCity);
        }
      } catch (error) {
        console.error('Error loading last city from storage:', error);
      }
    };

    fetchCityData();
    loadLastCity();
  }, []);

  const renderItem = (item) => (
    <View style={styles.cityCard} key={item.city}>
      <Text style={styles.cityName}>{item.city}</Text>
      <Text style={styles.cityTemp}>{item.temperature}°C</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <Text style={styles.heading}>Weather App</Text>

        <TextInput
          style={styles.search}
          value={search}
          placeholder="Search"
          onChangeText={setSearchTerm}
        />

        <TouchableOpacity style={styles.button} onPress={() => FetchData(search)}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

        {data && (
          <View style={styles.card}>
            <Image
              source={isDay ? require('./assets/sun.png') : require('./assets/moon.png')}
              style={styles.weatherIcon}
            />
            <Text style={styles.temperature}>{data.current.temperature_2m}°C</Text>
            <Text style={styles.location}>{search}</Text>
          </View>
        )}

        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 30, marginBottom: 10 }}>Top Cities</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={{marginTop:20}}/>
        ) : (
          city.map((item) => renderItem(item))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    padding: 20,
    paddingTop: 50,
  },


  heading: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 32,
    color: '#003366',
    marginBottom: 10,
  },

  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },

  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    marginTop: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  location: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    color: '#444',
  },

  temperature: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#f0f9ff',
    marginTop: 25,
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  weatherIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },

  cityCard: {
    backgroundColor: '#ffff',
    borderRadius: 15,
    padding: 15,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  cityTemp: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0066cc',
  },
});
