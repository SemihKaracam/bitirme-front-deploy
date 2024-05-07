import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import axios from "axios";
import "../App.css";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    listAll,
    getMetadata,
    deleteObject
} from "firebase/storage";
import { storage } from "../firebase";
import { v4 } from "uuid";
import ProgressBar from "../components/ProgressBar";
import 'moment/locale/tr'; // Türkçe yerel ayar dosyasını içe aktarın
import "./labelimage.css"
import moment from "moment"
import { FaCircleCheck } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt } from "react-icons/fa";


const LabelImagePage = () => {
    const canvasRef = useRef(null);
    const inputRef = useRef(null);
    let isDrawing = false;
    let startPoint = null;
    let rectangle = null;
    let endPoint = null
    const [imageUpload, setImageUpload] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sizeInBytes, setSizeInBytes] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    const [canvasInstances, setCanvasInstances] = useState([]);
    const [labelName, setLabelName] = useState("")
    const [existRect, setExistRect] = useState(false)
    const [kordinatlar, setKordinatlar] = useState("")
    const [selectedObject, setSelectedObject] = useState()

    const imagesListRef = ref(storage, "images/");

    const navigate = useNavigate()

    const removeLastObject = (canvas) => {
        if (canvas) {
            const objects = canvas.getObjects();
            console.log(objects)
            if (objects.length > 0) {
                const lastObject = objects[objects.length - 1];
                canvas.remove(lastObject);
            }
        }
    };
    useEffect(() => {
        console.log("rectangle: ", rectangle)

        const handleInputBlur = () => {
            // if (inputRef.current) {
            //     const value = inputRef.current.value;
            //     console.log("Input value:", value);
            //     document.body.removeChild(inputRef.current);
            //     inputRef.current = null;
            // }
        };
        return () => {

        };
    }, []);
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
                // Upload completed successfully, you can do something here if needed
                // For example, get the download URL of the uploaded image
                const metadata = await getMetadata(imageRef);
                console.log("metadata:", metadata)
                getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
                    // setImageUrls((prev) => [...prev, { imageUrl: url, metadata: metadata }]);
                    await axios.post("http://localhost:5000/resimYukle", { imageUrl: url, metadata: metadata })
                    getData()
                });
            }
        );
    };
    const getData = async () => {
        // try {
        //     const response = await listAll(imagesListRef);
        //     const tempItems = await Promise.all(
        //         response.items.map(async (item, index) => {
        //             console.log('item: ', item)
        //             const url = await getDownloadURL(item);
        //             console.log("url:", url);
        //             const metadata = await getMetadata(item);
        //             console.log("Metadata:", metadata);

        //             return { imageUrl: url, metadata: metadata };
        //         })
        //     );
        //     setImageUrls(tempItems);
        // } catch (error) {
        //     console.error("Error fetching data:", error);
        // }
        try {
            const res = await axios.get("http://localhost:5000/resimleriGetir")
            console.log(res.data)
            setImageUrls(res.data)
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    useEffect(() => {
        getData();
    }, []);
    const openModal = () => {
        setIsModalOpen(true);
    }
    const closeModal = () => {
        // clearInterval(intervalRef.current)
        setIsModalOpen(false)
    }

    const resimEtiketle = (imageUrl, metadata) => {
        setSelectedObject({ imageUrl, metadata })
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 420,
            height: 420,
            selection: false,
            // backgroundColor: 'red'
        });

        // Resmi yükle
        fabric.Image.fromURL(imageUrl, function (img) {
            // img.set({
            //     width: canvas.getWidth(),
            //     height: canvas.getHeight(),
            //     left: 0,
            //     top: 0,
            //     originX: 'left',
            //     originY: 'top'
            // });
            // img.center()

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                scaleX: canvas.width / img.width,
                scaleY: canvas.height / img.height,
                top: 0,
                left: 0,
                lockMovementX: true,
                lockMovementY: true,
            }); // Arka plan resmi olarak ayarla
        })
        //mouse sol tıkına basıldığında
        canvas.on('mouse:down', function (options) {
            console.log("true")
            options.e.preventDefault();
            removeLastObject(canvas)
            isDrawing = true;
            startPoint = canvas.getPointer(options.e);
            rectangle = new fabric.Rect({
                left: startPoint.x,
                top: startPoint.y,
                width: 0,
                height: 0,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
            });
            console.log(startPoint)
            canvas.add(rectangle);
            // setExistRect(true)
        });

        canvas.on('mouse:move', function (options) {
            if (!isDrawing) return;
            const pointer = canvas.getPointer(options.e);
            rectangle.set({ width: pointer.x - startPoint.x, height: pointer.y - startPoint.y });
            canvas.renderAll();
        });

        //mouse sol tıkı bırakıldığında
        canvas.on('mouse:up', function (options) {
            isDrawing = false;
            endPoint = canvas.getPointer(options.e);
            // console.log('Mouse Up Koordinatları:', endPoint);
            console.log("Başlangıç kordinatları:", startPoint)
            console.log("Bitiş kordinatları:", endPoint)
            let kordinatlar = startPoint.x + " " + startPoint.y + " " + endPoint.x + " " + endPoint.y
            setKordinatlar(kordinatlar)
            setExistRect(true)
        });
    }

    //Resimde etiketlenen alanın kordinat bilgilerini ve sınıf adını bulunduran txt dosyasını firebase'e yükleyen fonksiyon
    const handleSave = async () => {
        let fileName = JSON.parse(selectedObject.metadata).name
        console.log("filename:",selectedObject.metadata)
        const textContent = `${labelName} ${kordinatlar}`; // Etiket adı ve koordinatları birleştiriyoruz
        const fileContent = new Blob([textContent], { type: 'text/plain' }); // Metin içeriğini Blob olarak oluşturuyoruz
        const uploadTask = uploadBytesResumable(ref(storage, `images/label/${fileName}.txt`), fileContent); // Blob'u Firebase Storage'e yüklüyoruz

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                // Yükleme durumu değiştiğinde yapılacak işlemler
            },
            (error) => {
                // Hata durumunda yapılacak işlemler
                console.error(error);
            },
            () => {
                // Yükleme tamamlandığında yapılacak işlemler
                console.log('File uploaded successfully!');
            }
        );
    
        try {
            const res = await axios.put("http://localhost:5000/resimEtiketle", { imageUrl: selectedObject.imageUrl, labelName: labelName })
            getData()
            console.log(res.data)
        }
        catch (err) {
            console.log(err)
        }
        setIsModalOpen(false)
    }
    // Dosyanın varlığını kontrol etmek için bir fonksiyon
    async function checkIfFileExists(filePath) {
        const docRef = ref(storage, filePath)
        try {
            await getDownloadURL(docRef)
            console.log("var")
            return true
        } catch (error) {
            console.log("yok")
            return false
        }
    }
    const deleteImage = async (refUrl, metadata) => {
        // deleteObject(ref(storage, refUrl));
        const imageRef = ref(storage, refUrl);
        // Silme işlemlerini bir diziye ekleyelim
        const deleteOperations = [deleteObject(imageRef)]; // Resmi silme işlemi her durumda yapılacak
        if (checkIfFileExists(`images/label/${metadata.name}.txt`)) {
            const txtFileRef = ref(storage, `images/label/${metadata.name}.txt`);
            deleteOperations.push(deleteObject(txtFileRef));
        }

        // Silme işlemlerini paralel olarak gerçekleştirelim
        await Promise.all(deleteOperations);
        await axios.delete("http://localhost:5000/resimSil",{imageRef})
        getData()
        // navigate(0)
    };

    useEffect(() => {
        if (uploadProgress == 100) {
            // navigate(0)
            // getData()
        }
    }, [uploadProgress])


    return (
        <div className='label-image-page'>
            <div className="button-container">
                {/* <input
          type="file"
          onChange={(event) => {
            setImageUpload(event.target.files[0]);
          }}
        /> */}
                <div className="mt-4 gap-4 d-flex align-items-center justify-content-center">
                    {/* <label for="file-upload" class="custom-file-upload">
            Dosya Seç
          </label> */}
                    <input onChange={(event) => {
                        setImageUpload(event.target.files[0]);
                    }} id="file-upload" type="file" />
                    <button className="upload-btn" disabled={uploadProgress > 0 && uploadProgress < 100} onClick={uploadFile}> Upload Image</button>
                    {uploadProgress > 0 && <ProgressBar percentage={uploadProgress} />}
                </div>
            </div>

            {/* <div className='image-list-container mt-5'>
                <div className="shadow p-3 mb-5 bg-body rounded">
                    <canvas ref={canvasRef} />
                </div>
                <div className="shadow p-3 mb-5 bg-body rounded">
                    <canvas ref={canvasRef} />
                </div>
            </div> */}


            {/* Resimlerin ve metadatanın render edildiği kısım*/}
            <div className="list-container mt-4">
                {imageUrls.length > 0 &&
                    imageUrls
                        .map((img, index) => {
                            console.log(img)
                            return (
                                <div className="shadow p-3 mb-5 bg-body rounded" key={index}>
                                    {
                                        !img.imageUrl ?
                                            (<div
                                                style={{ width: "420px", height: "420px", backgroundColor: "gray", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
                                                Resim henüz yüklenemedi
                                            </div>)
                                            :
                                            (<img
                                                key={index}
                                                style={{ width: "420px", height: "420px" }}
                                                src={img.imageUrl}
                                                alt={`uploaded ${index}`}
                                            />)
                                    }
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <button onClick={() => resimEtiketle(img.imageUrl, img.metadata)} type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">Resmi Etiketle</button>
                                        <div className='py-1 px-2' style={{backgroundColor:img.labelName ? '#0A9B43' : 'gray', borderRadius:'5px',color:"white"}}>
                                            {img.labelName ? img.labelName : "Etiketlenmedi"}
                                        </div>
                                        <button onClick={() => deleteImage(img.imageUrl, img.metadata)} type="button" class="btn btn-danger">
                                            <FaTrashAlt size={20} />
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        )}
            </div>
            <div class="modal fade modal-lg" id="exampleModal" data-bs-backdrop="static" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title" id="exampleModalLabel">Resim Etiketleme</h4>
                            {/* <button onClick={closeModal} type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button> */}
                        </div>
                        <div class="modal-body d-flex justify-content-center gap-4">
                            <div className='d-flex flex-column gap-2'>
                                <label htmlFor="">Etiket Adı</label>
                                <input className='label-name' onChange={(e) => setLabelName(e.target.value)} placeholder='Etiket Adını Giriniz.' />
                            </div>
                            <div className='d-flex flex-column align-items-center justify-content-center gap-2'>
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button disabled={existRect == false || labelName == ""} onClick={handleSave} type="button" class="btn btn-primary" data-bs-dismiss="modal">Kaydet</button>
                            <button onClick={closeModal} type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    )

};

export default LabelImagePage;


