import "./App.css";
import Chat from "./components/Chat/Chat";
import Image from "./components/Image/Image";
import Moder from "./components/moder/Moder";

function App() {
  return (
    <div>
      <Moder />
      <br />
      <Chat />

      <br />
      <hr />
      <br />
      <Image />
    </div>
  );
}

export default App;
