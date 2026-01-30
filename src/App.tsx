import { useState, useRef } from 'react'
import { ImageUploader } from './components/ImageUploader'
import { CensorCanvas, type CensorCanvasHandle } from './components/CensorCanvas'
import './index.css'

function App() {
  const [file, setFile] = useState<File | null>(null);
  const canvasRef = useRef<CensorCanvasHandle>(null);

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
            <CensorCanvas ref={canvasRef} imageFile={file} />
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => canvasRef.current?.download()}
                style={{ background: 'transparent', border: '1px solid #666' }}
              >
                Download Image
              </button>
              <button
                onClick={() => setFile(null)}
                style={{ background: 'transparent', border: '1px solid #666' }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
