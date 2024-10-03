import { useRef, useState } from "react";
import { getDecodedToken, getEncodedTokenV3 } from "./token";

function App() {
  const [token, setToken] = useState("");
  const [objectString, setObjectString] = useState("");

  function onTokenToObject() {
    if (token) {
      setObjectString(JSON.stringify(getDecodedToken(token), undefined, 2));
    }
  }

  function onObjectToV3Token() {
    if (objectString) {
      const parsed = JSON.parse(objectString);
      setToken(getEncodedTokenV3(parsed));
    }
  }

  return (
    <div className="inset-0 absolute flex gap-2">
      <div className="bg-red-50 grow text-black">
        <textarea
          className="w-full h-full p-1"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
          }}
        />
      </div>
      <div className="bg-lime-100 flex flex-col items-center justify-center gap-2 px-8">
        i
        <button
          className="bg-gray-600 px-2 py-1 rounded"
          onClick={onTokenToObject}
        >
          To Token Object
        </button>
        <button
          className="bg-gray-600 px-2 py-1 rounded"
          onClick={onObjectToV3Token}
        >
          To V3 Token
        </button>
        <button className="bg-gray-600 px-2 py-1 rounded">To V4 Token</button>
      </div>
      <div className="bg-blue-100 grow">
        <textarea
          className="w-full h-full text-black"
          value={objectString}
          onChange={(e) => {
            setObjectString(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

export default App;
