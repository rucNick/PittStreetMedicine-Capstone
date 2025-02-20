import {
  useJsApiLoader,
  GoogleMap,
} from "@react-google-maps/api";


const center = {
  lat: 6.9271,
  lng: 79.8612,
};


function App() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "YOUR-API-KEY",
  });
  return isLoaded ? (
    <>
      <GoogleMap
        center={center}
        zoom={8}
        mapContainerStyle={{ width: "100%", height: "100vh" }}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
      </GoogleMap>
    </>
  ) : (
    <></>
  );
}
export default App;
