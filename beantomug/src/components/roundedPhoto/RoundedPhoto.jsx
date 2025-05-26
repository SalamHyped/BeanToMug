export default function RoundedPhoto({ src, alt, size = 150, borderWidth = 3, borderColor = '#ffffff' }) {
    const style = {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    };
  
    return (
      <div className="rounded-photo" style={style}>
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }