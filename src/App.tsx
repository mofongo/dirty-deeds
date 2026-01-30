import { useState } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { CensorCanvas } from './components/CensorCanvas'
import './index.css'

function App() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <>
      <div className={`header ${file ? 'compact' : ''}`}>
        <h1>Dirty Deeds</h1>
      </div>

      <div className="card">
        {!file ? (
          <ImageUploader onImageSelected={setFile} />
        ) : (
          <div>
            <CensorCanvas imageFile={file} />
            <button
              onClick={() => setFile(null)}
              style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #666' }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default App
