import { MdRestaurant } from 'react-icons/md';
import { getApiConfig } from '../../utils/config';

export default function RoundedPhoto({ src, alt, size = 150, borderWidth = 3, borderColor = '#ffffff' }) {
    const style = {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    };
    console.log("src", src);
  
    // If no src, show icon placeholder
    if (!src) {
      return (
        <div className="rounded-photo" style={{...style, backgroundColor: '#f8fafc'}}>
          <div style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: `${size * 0.4}px`, marginBottom: '8px' }}>
              <MdRestaurant />
            </div>
            <div style={{ fontSize: `${size * 0.12}px`, fontWeight: '600' }}>
              {alt.split(' ').map(word => word[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      );
    }
    
    // If src exists, construct full URL and show image
    const fullImageUrl = `${getApiConfig().baseURL}${src}`;
    
    return (
      <div className="rounded-photo" style={style}>
        <img 
          src={fullImageUrl} 
          alt={alt} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }