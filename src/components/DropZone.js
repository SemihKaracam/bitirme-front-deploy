import React from 'react'
import { useDropzone } from 'react-dropzone';
import { IoCloudUpload } from "react-icons/io5";


const DropZone = () => {
    const {acceptedFiles, getRootProps, getInputProps} = useDropzone();
    const files = acceptedFiles.map(file => (
      <li key={file.path}>
        {file.path} - {file.size} bytes
      </li>
    ));
  
    return (
      <section className="container">
        <div {...getRootProps({className: 'dropzone'})}>
          <input {...getInputProps()} />
          <p>İstediğiniz dosyayı buraya sürükleyebilirsiniz veya tıklayarak dosya seçebilirsiniz</p>
          <IoCloudUpload className='icon'/>
        </div>
        <aside>
          <ul>{files}</ul>
        </aside>
      </section>
    );
}

export default DropZone