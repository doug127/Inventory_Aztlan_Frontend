import { Button } from '@/ui/components/Button.jsx';

function App() {
  const handleClick = () => {
    alert("¡Botón funcionando!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Test de Button</h1>
      <Button onClick={handleClick} variant="primary">
        Presióname
      </Button>
    </div>
  );
}

export default App
