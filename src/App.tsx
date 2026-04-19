// src/App.tsx
import AppRoutes from "./routes"; // Import tanpa kurung kurawal karena 'export default'

function App() {
  // Panggil AppRoutes sebagai komponen biasa, bukan RouterProvider
  return (
    <AppRoutes />
  );
}

export default App;