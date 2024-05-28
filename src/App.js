
import "./App.css";
import { useState, useEffect } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  getMetadata,
  getStorage,
  deleteObject
} from "firebase/storage";
import { storage } from "./firebase";
import ReactLoading from "react-loading"
import { v4 } from "uuid";
import ProgressBar from "./components/ProgressBar";
import moment from 'moment';
import 'moment/locale/tr'; // Türkçe yerel ayar dosyasını içe aktarın
import { useNavigate } from "react-router-dom";
import axios from "axios"
import { FaCircleCheck } from "react-icons/fa6";
import { IoMdCloseCircle } from "react-icons/io";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import heatmap from "./assets/heatmap.png"



function App() {
  const [imageUpload, setImageUpload] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false)
  const [resYapayzeka, setResYapayzeka] = useState()
  const [heatmapUrl, setHeatmapUrl] = useState()
  const [requestDuration, setRequestDuration] = useState(null);

  const navigate = useNavigate()

  const imagesListRef = ref(storage, "images/");

  const uploadFile = () => {
    if (imageUpload == null) return;
    const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
    const uploadTask = uploadBytesResumable(imageRef, imageUpload);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Error uploading file:", error);
      },
      async () => {
        const metadata = await getMetadata(imageRef);
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setImageUrls((prev) => [...prev, { imageUrl: url, metadata }]);
        });
      }
    );
  };

  const getData = async () => {
    try {
      const response = await listAll(imagesListRef);
      const tempItems = await Promise.all(
        response.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          return { imageUrl: url, metadata: metadata };
        })
      );
      setImageUrls(tempItems);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (uploadProgress === 100) {
      getData();
    }
  }, [uploadProgress]);

  useEffect(() => {
    getData();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  }
  const closeModal = () => {
    setIsModalOpen(false);
  }

  const handleTestEt = async (imageUrl) => {
    setRequestDuration(0)
    setIsModalOpen(true);
    setLoading(true);
    try {
      const res = await axios.post("https://bitirmeflask.duckdns.org/yapayzeka", { imageUrl });
      setResYapayzeka(res.data);
      if(res.data.prediction > 0.5){
        const startTime = Date.now();  // Başlangıç zamanını al
        const resHeatmap = await axios.post("https://bitirmeflask.duckdns.org/generate-heatmap", { imageUrl }, { responseType: 'blob' })
        const url = URL.createObjectURL(resHeatmap.data)
        const endTime = Date.now();  // Bitiş zamanını al
        const durationInMillis = endTime - startTime;  // Süreyi hesapla
        setRequestDuration(durationInMillis / 1000);  // Milisaniyeyi saniyeye çevir ve state'e ata
        setHeatmapUrl(url)
        console.log(url)
      }

    } catch (err) {
      console.log(err)
    }
    setLoading(false);
  }

  const handleDelete = async (imgPath) => {
    const fileRef = ref(storage, imgPath);
    try {
      await deleteObject(fileRef);
      setImageUrls((prev) => prev.filter((img) => img.metadata.fullPath !== imgPath));
      console.log('File deleted successfully');
      toast.success("Fotoğraf başarıyla silindi!")
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  const handleNavigate = () => {
    navigate("/grafik");
  }

  return (
    <div className="App">
      <div className="button-container">
        <div className="mt-4 gap-4 d-flex align-items-center justify-content-center">
          <input onChange={(event) => {
            setImageUpload(event.target.files[0]);
          }} id="file-upload" type="file" />
          <button className="upload-btn" disabled={uploadProgress > 0 && uploadProgress < 100} onClick={uploadFile}> Upload Image</button>
          {uploadProgress > 0 && <ProgressBar percentage={uploadProgress} />}
        </div>
        <div className="mt-4 d-flex align-items-center justify-content-center">
          <button onClick={handleNavigate} className="upload-btn">
            Performans Çıktıları
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h2>Yüklenen Fotoğraflar</h2>
        <div className="list-container">
          {imageUrls.length > 0 &&
            imageUrls
              .sort((a, b) => new Date(b?.metadata?.timeCreated) - new Date(a?.metadata?.timeCreated))
              .map((img, index) => (
                <div key={index} className="shadow p-3 mb-5 bg-body rounded">
                  {!img.imageUrl ? (
                    <div
                      style={{ width: "420px", height: "420px", backgroundColor: "gray", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
                      Resim henüz yüklenemedi
                    </div>
                  ) : (
                    <img
                      style={{ width: "420px", height: "420px" }}
                      src={img.imageUrl}
                      alt={`uploaded ${index}`}
                    />
                  )}
                  <div className="d-flex flex-column justify-content-center align-items-center">
                    <p><b>Resim Boyutu: </b>{(img?.metadata?.size / 1000000).toFixed(2)} MB</p>
                    <p><b>Yüklenme Tarihi: </b>{moment(img?.metadata?.timeCreated).format('LLL')}</p>
                    <div className="d-flex align-items-center gap-2">
                      <button onClick={() => handleTestEt(img.imageUrl)} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">Test Et</button>
                      <button onClick={() => handleDelete(img?.metadata.fullPath)} className="btn btn-danger">Fotoğrafı Sil</button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      <div className="modal fade modal-lg" id="exampleModal" data-bs-backdrop="static" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="exampleModalLabel">Model Test Sonucu</h4>
            </div>
            <div className="modal-body d-flex align-items-center justify-content-center">
              {loading ? (
                <div className='d-flex flex-column align-items-center justify-content-center gap-4'>
                  <p className='h3'>Hatalı ürün testi yapılıyor</p>
                  <ReactLoading type='spin' color='black' width={'48px'} height={'48px'} />
                </div>
              ) : (
                <div className='d-flex flex-column align-items-center justify-content-center gap-3'>
                  {resYapayzeka && (
                    resYapayzeka?.prediction[0] < 0.5 ? (
                      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                        <span style={{ fontWeight: 500, fontSize: '28px' }}>
                          BAŞARILI ÜRÜN
                        </span>
                        <FaCircleCheck size='48px' color="green" />
                      </div>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                        <span style={{ fontWeight: 500, fontSize: '28px' }}>
                          HATALI ÜRÜN
                        </span>
                        <IoMdCloseCircle size='48px' color="red" />
                      </div>
                    )
                  )}
                  {
                    resYapayzeka?.prediction[0] > 0.5 &&
                      (<div>
                        <img
                          style={{ width: "240px", height: "240px" }}
                          src={heatmapUrl}
                        />
                      </div>)
                  }
                  <p style={{ fontSize: '24px' }}>Modelin tahminleme süresi: <b style={{ color: 'red' }}>{((resYapayzeka?.predictionTime) / 1000).toFixed(2)}</b> saniye</p>
                  <p style={{ fontSize: '24px' }}>Resmin modele yüklenme süresi: <b style={{ color: 'red' }}>{((resYapayzeka?.loadTime) / 1000).toFixed(2)}</b> saniye</p>
                  {requestDuration > 0 && <p style={{ fontSize: '24px' }}>Heat map oluşturma süresi: <b style={{ color: 'red' }}>{requestDuration?.toFixed(2)}</b> saniye</p>}
                </div>
              )}
              <div className="button-close-div">
                <button onClick={closeModal} style={{ marginBottom: '12px' }} type="button" className="close-button btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
              </div>
            </div>
            {/* <div className="modal-footer">
              <button onClick={closeModal} type="button" className="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            </div> */}
          </div>
        </div>
      </div>
      {/* <div className="modal fade modal-lg show" id="exampleModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="exampleModalLabel">Model Test Sonucu</h4>
            </div>
            <div className="modal-body d-flex align-items-center justify-content-center">
              {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center gap-4">
                  <p className="h2">Hatalı ürün testi yapılıyor</p>
                  <ReactLoading type="spin" color="black" width="48px" height="48px" />
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center gap-3">
                  {resYapayzeka && (
                    resYapayzeka?.prediction[0] < 0.5 ? (
                      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                        <span className="result-text" style={{ color: 'green' }}>
                          BAŞARILI ÜRÜN
                        </span>
                        <FaCircleCheck size="48px" color="green" />
                      </div>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                        <span className="result-text" style={{ color: 'red' }}>
                          HATALI ÜRÜN
                        </span>
                        <IoMdCloseCircle size="48px" color="red" />
                      </div>
                    )
                  )}
                  <div>
                    <img style={{ width: '240px', height: '240px' }} src={heatmap} alt="Heatmap" />
                  </div>
                  <p className="result-text">Modelin tahminleme süresi: <b style={{ color: 'red' }}>{((resYapayzeka?.predictionTime) / 1000).toFixed(2)}</b> saniye</p>
                  <p className="result-text">Resmin modele yüklenme süresi: <b style={{ color: 'red' }}>{((resYapayzeka?.loadTime) / 1000).toFixed(2)}</b> saniye</p>
                </div>
              )}
              <div className="button-close-div">
                <button onClick={closeModal} style={{ marginBottom: '12px' }} type="button" className="close-button btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      <ToastContainer />
    </div>
  );
}

export default App


























// import "./App.css";
// import { useState, useEffect } from "react";
// import {
//   ref,
//   uploadBytesResumable,
//   getDownloadURL,
//   listAll,
//   getMetadata,
//   getStorage,
//   deleteObject
// } from "firebase/storage";
// import { storage } from "./firebase";
// import ReactLoading from "react-loading"
// import { v4 } from "uuid";
// import ProgressBar from "./components/ProgressBar";
// import moment from 'moment';
// import 'moment/locale/tr'; // Türkçe yerel ayar dosyasını içe aktarın
// import { FaCircleCheck } from "react-icons/fa6";
// import { IoMdCloseCircle } from "react-icons/io";
// import { useNavigate } from "react-router-dom";
// import axios from "axios"
// function App() {
//   const [imageUpload, setImageUpload] = useState(null);
//   const [imageUrls, setImageUrls] = useState([]);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [sizeInBytes, setSizeInBytes] = useState(0);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loading, setLoading] = useState(false)
//   const [testResult, setTestResult] = useState("OK")
//   const [resYapayzeka,setResYapayzeka] = useState()
//   const navigate = useNavigate()

//   const imagesListRef = ref(storage, "images/");

//   const uploadFile = () => {
//     if (imageUpload == null) return;
//     const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
//     const uploadTask = uploadBytesResumable(imageRef, imageUpload);

//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         const progress = Math.round(
//           (snapshot.bytesTransferred / snapshot.totalBytes) * 100
//         );
//         setUploadProgress(progress);
//       },
//       (error) => {
//         console.error("Error uploading file:", error);
//       },
//       async () => {
//         // Upload completed successfully, you can do something here if needed
//         // For example, get the download URL of the uploaded image
//         const metadata = await getMetadata(imageRef);
//         console.log("metadata:", metadata)
//         getDownloadURL(uploadTask.snapshot.ref).then((url) => {
//           setImageUrls((prev) => [...prev, url]);
//         });
//       }
//     );
//   };
//   const getData = async () => {
//     try {
//       const response = await listAll(imagesListRef);
//       const tempItems = await Promise.all(
//         response.items.map(async (item) => {
//           console.log('item: ', item)
//           const url = await getDownloadURL(item);
//           console.log("url:", url);
//           const metadata = await getMetadata(item);
//           console.log("Metadata:", metadata);
//           return { imageUrl: url, metadata: metadata };
//         })
//       );
//       setImageUrls(tempItems);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     if (uploadProgress == 100) {
//       // navigate(0)
//       getData()
//     }
//   }, [uploadProgress])

//   useEffect(() => {
//     getData();
//   }, []);


//   const openModal = () => {
//     setIsModalOpen(true);
//   }
//   const closeModal = () => {
//     // clearInterval(intervalRef.current)
//     setIsModalOpen(false)
//   }
//   function timeout(delay) {
//     return new Promise(res => setTimeout(res, delay));
//   }
//   const handleTestEt = async (imageUrl) => {
//     setIsModalOpen(true)
//     setLoading(true)
//     console.log("image url:",imageUrl)
//     // const res = await axios.post("http://localhost:5000/yapayzeka",{imageUrl})
//     const res = await axios.post("http://165.22.18.182:5000/yapayzeka",{imageUrl})
//     console.log("res yapayzeka: ",res.data)
//     setResYapayzeka(res.data)
//     setLoading(false)
//   }

//   const handleDelete = (imgPath)=>{
//     const storage = getStorage()
//     const fileRef = ref(storage, imgPath)
//     deleteObject(fileRef)
//     .then(() => {
//       console.log('File deleted successfully');
//       // Resim başarıyla silindiğinde yapılacak işlemler
//       // Örneğin, state güncelleyebilir veya kullanıcıya bildirim gösterebilirsiniz
//     })
//     .catch((error) => {
//       console.error('Error deleting file:', error);
//       // Hata durumunda yapılacak işlemler
//     });

//     getData()
//   }

//   const handleNavigate=()=>{
//     navigate("/grafik")
//   }

//   return (
//     <div className="App">
//       <div className="button-container">
//         {/* <input
//           type="file"
//           onChange={(event) => {
//             setImageUpload(event.target.files[0]);
//           }}
//         /> */}
//         <div className="mt-4 gap-4 d-flex align-items-center justify-content-center">
//           {/* <label for="file-upload" class="custom-file-upload">
//             Dosya Seç
//           </label> */}
//           <input onChange={(event) => {
//             setImageUpload(event.target.files[0]);
//           }} id="file-upload" type="file" />
//           <button className="upload-btn" disabled={uploadProgress > 0 && uploadProgress < 100} onClick={uploadFile}> Upload Image</button>
//           {uploadProgress > 0 && <ProgressBar percentage={uploadProgress} />}
//         </div>
//         <div className="mt-4 d-flex align-items-center justify-content-center">
//           <button onClick={handleNavigate} className="upload-btn">
//             Performans Çıktıları
//           </button>
//         </div>
//       </div>

//       <div className="mt-5">
//         <h2>Yüklenen Fotoğraflar</h2>
//         <div className="list-container">
//           {imageUrls.length > 0 &&
//             imageUrls
//               .sort((a, b) => new Date(b?.metadata?.timeCreated) - new Date(a?.metadata?.timeCreated)) //yüklenen resimlerin tarihlerine göre sondan başa sıralıyor
//               .map((img, index) => {
//                 console.log("tarih: ", new Date(img?.metadata?.timeCreated).getTime())
//                 console.log("firebase image:", img?.metadata.fullPath)
//                 return (
//                   <div className="shadow p-3 mb-5 bg-body rounded">
//                     {
//                       !img.imageUrl ?
//                         (<div
//                           style={{ width: "420px", height: "420px", backgroundColor: "gray", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
//                           Resim henüz yüklenemedi
//                         </div>)
//                         :
//                         (<img
//                           key={index}
//                           style={{ width: "420px", height: "420px" }}
//                           src={img.imageUrl}
//                           alt={`uploaded ${index}`}
//                         />)
//                     }
//                     <div className="d-flex flex-column justify-content-center align-items-center">
//                       <p><b>Resim Boyutu: </b>{(img?.metadata?.size / 1000000).toFixed(2)} MB</p>
//                       <p><b>Yüklenme Tarihi: </b>{moment(img?.metadata?.timeCreated).format('LLL')}</p>
//                       <div className="d-flex align-items-center gap-2">
//                         <button onClick={()=>handleTestEt(img.imageUrl)} type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">Test Et</button>
//                         <button onClick={()=>handleDelete(img?.metadata.fullPath)} className="btn btn-danger">Fotoğrafı Sil</button>
//                       </div>
//                     </div>
//                   </div>
//                 )
//               }
//               )}
//         </div>
//       </div>

//       <div class="modal fade modal-lg" id="exampleModal" data-bs-backdrop="static" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
//         <div class="modal-dialog" role="document">
//           <div class="modal-content">
//             <div class="modal-header">
//               <h4 class="modal-title" id="exampleModalLabel">Model Test Sonucu</h4>
//               {/* <button onClick={closeModal} type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
//                 <span aria-hidden="true">&times;</span>
//               </button> */}
//             </div>
//             <div class="modal-body d-flex align-items-center justify-content-center">
//               {
//                 loading ?
//                   (
//                     <div className='d-flex flex-column align-items-center justify-content-center gap-4'>
//                       <p className='h2'>Hatalı ürün testi yapılıyor</p>
//                       <ReactLoading type='spin' color='black' width={'48px'} height={'48px'} />
//                     </div>
//                   ) :
//                   (
//                     <div className='d-flex flex-column align-items-center justify-content-center gap-3'>
//                       {
//                         resYapayzeka && (
//                         resYapayzeka?.prediction[0] < 0.5  ?
//                           (
//                             <div className="d-flex flex-column align-items-center justify-content-center gap-2">
//                               <span style={{ fontWeight: 500, fontSize: '28px' }}>
//                                 BAŞARILI ÜRÜN
//                               </span>
//                               <FaCircleCheck size='48px' color="green" />
//                             </div>
//                           ) : (
//                             <div className="d-flex flex-column align-items-center justify-content-center gap-2">
//                               <span style={{ fontWeight: 500, fontSize: '28px' }}>
//                                 HATALI ÜRÜN
//                               </span>
//                               <IoMdCloseCircle size='48px' color="red" />
//                             </div>
//                           )
//                         )
//                       }
//                     <p style={{fontSize:'24px'}}>Modelin tahminleme süresi: <b style={{color:'red'}}>{((resYapayzeka?.predictionTime)/1000).toFixed(2)}</b> saniye</p>                      
//                     <p style={{fontSize:'24px'}}>Resmin modele yüklenme süresi: <b style={{color:'red'}}>{((resYapayzeka?.loadTime)/1000).toFixed(2)}</b> saniye</p>                      
//                     {/* <p style={{fontSize:'24px'}}>Resmin modele yüklenme süresi: <b style={{color:'red'}}>{(Math.random() * (3 - 2) +2).toFixed(2)}</b> saniye</p>                       */}
//                     </div>
//                   )
//               }
//             </div>
//             <div class="modal-footer">
//               <button onClick={closeModal} type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;









