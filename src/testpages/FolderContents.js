import React, { useState, useRef, useEffect, useMemo, useContext, useCallback } from "react";
import styles from "../styles/foldercontents.module.css";
import { handleDownload, handleMoveToTrash } from "../api/file";
import { createFolder } from "../api/folder";
import { useNavigate } from "react-router-dom";
import { FolderContext } from "../context/FolderContext";
import { useParams } from "react-router-dom";
import ContextMenu from "./ContextMenu";

export default function FolderContents({ folderId, onGanClick }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const { uploadImages, setTopFolderName, topFolderName, putBackList, setCheckedFiles, setEditIndex, editIndex, updatedFileList, setNewFolderInfo, renameFolderInfo, setRenameFolderInfo, movedFileList, movedFolderInfo, setRemovedFileList, isEditing, setIsEditing } = useContext(FolderContext);
  const rootFolderId = localStorage.getItem("rootFolderId"); // 로컬 스토리지에서 root folder id 가져오기
  const userId = localStorage.getItem("userId"); // 로컬 스토리지에서 userId 가져오기
  
  //const [folderId, setFolderId] = useState(paramFolderId || rootFolderId);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isChecked, setIsChecked] = useState([]);
  const [newName, setNewName] = useState("");
  const [newFolderName, setNewFolderName] = useState("Untitled folder"); // 폴더 생성 시 사용할
  const [fileList, setFileList] = useState([]);
  const [folderList, setFolderList] = useState([]);
  const [imagePaths, setImagePaths] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // upload
  const [isActive, setActive] = useState(false);
  const handleDragStart = () => setActive(true);
  const handleDragEnd = () => setActive(false);
  const handleDragOver = (event) => { 
    event.preventDefault();
    setActive(true);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setActive(false);

    const files = event.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const fileObjects = fileArray.map(file => ({ file }));
    uploadFiles(fileObjects, id);
  };

  const uploadFiles = async (fileObjects ,id) => {
    const formData = new FormData();
    fileObjects.forEach(({ file }) => {
        formData.append('files', file);
    });

    try {
      const response = await fetch(`http://3.38.95.127:8080/file/upload/${id}`, {
        method: 'POST',
        headers: {
          'accept': '*/*'
      },
        body: formData
      });

      if (response.status === 201) {
        await fetchFileData(folderId);
        await fetchFolderData(folderId);
      } else {
        console.log('Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    }
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    id: null,
    type: null,
  });

  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const newFolderInputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  useEffect(() => {
    if (spanRef.current) {
      setInputWidth(spanRef.current.getBoundingClientRect().width + 10);
    }
  }, [newName, newFolderName]);

  useEffect(() => {
    if (editIndex !== null) {
      const folderToEdit = folderList.find(folder => folder.folder_id === editIndex);
      if (folderToEdit) {
        setNewName(folderToEdit.folder_name);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  }, [editIndex, folderList]);

  useEffect(() => {
    if (isCreating && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreating]);

  // input 바깥 눌렀을 때
  const handleClick = (index) => {
    // 폴더 생성
    if (isCreating) {
      handleCreateFolder();
    } else if (index !== null) { // 이름 바꾸기
      changeFolderName(index);
    }
    setIsCreating(false);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isCreating) {
      setNewFolderName("Untitled folder");
    }
  }, [isCreating]);

  const toggleCheck = (index) => {
    setIsChecked((prev) => {
      const newChecked = [...prev];
      if (newChecked[index]) {
        newChecked[index] = false;
      } else {
        newChecked[index] = fileList[index].file_id;
      }
      setCheckedFiles(newChecked.filter(id => id !== false));
      return newChecked;
    });
  };

  const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
  };

  const handleInputChange = (e) => {
    setNewName(e.target.value);
  };

  const handleNewFolderInputChange = (e) => {
    setNewFolderName(e.target.value);
  };

  // 폴더 이름 수정
  const changeFolderName = async (folderId) => {
    let folderName = newName !== "" ? newName : contextMenu.name;
    try {
      const response = await fetch(
        `http://3.38.95.127:8080/folder/${folderId}/name/${folderName}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const updatedNames = [...folderList];
        const index = updatedNames.findIndex(folder => folder.folder_id === folderId);
        updatedNames[index].folder_name = folderName;
        setFolderList(updatedNames);
        setEditIndex(null);
        setRenameFolderInfo(folderName);
      } else {
        console.error("Error updating folder name:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating folder name:", error);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      if (index === null) {
        handleCreateFolder();
      } else {
        changeFolderName(folderList[index].folder_id);
      }
      setIsCreating(false);
    }
  };

  // 폴더 내 파일 정보 조회
  const fetchFileData = async (id) => {
    try {
      const response = await fetch(
        `http://3.38.95.127:8080/folder/child/file/${id}`
      );
      const data = await response.json();
      console.log("File", data.files);
      setFileList(data.files);
      const newImagePaths = data.files.map((file) => file.s3_key);
      setImagePaths(newImagePaths);
      setIsChecked(new Array(newImagePaths.length).fill(false));
    } catch (error) {
      console.error("Error fetching folder data:", error);
    }
  };

  // 폴더 내 하위 폴더 조회
  const fetchFolderData = async (id) => {
    try {
      const response = await fetch(
        `http://3.38.95.127:8080/folder/child/folder/${id}`
      );
      const data = await response.json();
      console.log("Folder", data.folders);
      setFolderList(data.folders);
    } catch (error) {
      console.error("Error fetching folder data:", error);
    }
  };

  const handleDownloadSelected = async () => {
    const selectedFileIds = isChecked.filter((id) => id !== false);
    for (const fileId of selectedFileIds) {
      await handleDownload(fileId);
    }
  };

  const handleTrashSelected = async () => {
    const selectedFileIds = isChecked.filter((id) => id !== false);
    for (const fileId of selectedFileIds) {
      await handleMoveToTrash(fileId);
      setRemovedFileList((prevRemovedList) => [
        ...prevRemovedList,
          fileId,
      ]);
    }

    // 파일 휴지통 이동 후 재정렬
    const updatedFileList = fileList.filter(
      (file) => !selectedFileIds.includes(file.file_id)
    );
    const updatedImagePaths = updatedFileList.map((file) => file.s3_key);

    setFileList(updatedFileList);
    setImagePaths(updatedImagePaths);
    setIsChecked(new Array(updatedImagePaths.length).fill(false));
  };

  useEffect(() => {
    const id = folderId || rootFolderId;
    fetchFileData(id);
    fetchFolderData(id);
  }, [folderId, rootFolderId, uploadImages, putBackList, updatedFileList, renameFolderInfo, movedFileList, movedFolderInfo]);

  const handleFolderClick = (folderId, name) => {
    navigate(`/home/${folderId}`);
    setTopFolderName(name);
    fetchFileData(folderId);
    fetchFolderData(folderId);
  };

  const prevFolderClick = () => {
    navigate(-1);
  };
  
  const handleCreateFolder = useMemo(
    () => async () => {
      let folderName = newFolderName !== "" ? newFolderName : "Untitled Folder"
      try {
        const newFolder = await createFolder(folderName, userId, id);
        if (newFolder) {
          // 폴더 생성 후 로딩 상태 해제
          setFolderList((prevFolderList) => [
            ...prevFolderList,
            {
              folder_id: newFolder.folder_id,
              folder_name: newFolder.folder_name, 
            },
          ]);
          setNewFolderInfo(newFolder);
          fetchFolderData(id);
        }
      } catch (error) {
        console.error("Error creating new folder:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [newFolderName, setNewFolderInfo, userId, id]
  );

  // const getFileId = (index) => {
  //   return fileList[index].file_id;
  // };

  const dragStartHandler = (e, id, type) => {
    e.dataTransfer.setData(type === "file" ? "text/plain" : "folder/plain", id);
    setIsDragging(true);
  };

  const handleContextMenu = (e, id, type, name) => {
    e.preventDefault();
    console.log(contextMenu.id);
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      id: id,
      type: type,
      name: name,
    });
  };

  const [hoveredButton, setHoveredButton] = useState(null);

  const handleMouseOver = (buttonName) => {
    setHoveredButton(buttonName);
  };

  const handleMouseOut = () => {
    setHoveredButton(null);
  };

  return (
    <div 
      className={styles.container}
      onClick={() => setContextMenu({ ...contextMenu, visible: false })}
    >
      <div className={styles.titleBar}>
        <div>{id !== rootFolderId ? topFolderName : "Sunha's folder"}</div>
      </div>
      <div className={styles.contentsZone}>
        <div className={styles.actionZone}>
          <div className={styles.navigator}>
            <div className={styles.navIcon}>↩</div>
            <div 
              onClick={prevFolderClick}
              className={styles.navText}
            >
              Go Back
            </div>
          </div>
          <div className={styles.childFolders} onClick={(e) => {isEditing && handleClick(contextMenu.id); }}>
            {folderList.map((folder, index) => (
              <div
                key={folder.folder_id}
                className={`${styles.folderList} ${isDragging ? styles.dragging : ""  }`}
                draggable={true}
                onDragStart={(e) => dragStartHandler(e, folder.folder_id, "folder")}
                onDragEnd={() => setIsDragging(false)}
                onContextMenu={(e) =>
                  handleContextMenu(e, folder.folder_id, "folder", folder.folder_name)
                }
              >
                {editIndex === folder.folder_id ? (
                  <>
                    <div className={styles.folderIcon} />
                    <div className={styles.blankBox} />
                    <div>
                      <input
                        type="text"
                        ref={inputRef}
                        value={newName}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={styles.input}
                        style={{ width: `${inputWidth}px` }}
                      />
                      <span ref={spanRef} className={styles.hiddenSpan}>
                        {newName}
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    key={folder.folder_id}
                    className={styles.folderRow}
                    tabIndex="0"
                    onDoubleClick={() =>
                      handleFolderClick(folder.folder_id, folder.folder_name)
                    }
                  >
                    <div className={styles.folderIcon} />
                    <div className={styles.blankBox} />
                    <div className={styles.folderName}>
                      {folder.folder_name}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isCreating && (
              <div key="creating-folder" className={styles.folderList}>
                <div className={styles.folderIcon} />
                <div className={styles.blankBox} />
                <div key="new-folder">
                  <input
                    type="text"
                    ref={newFolderInputRef}
                    value={newFolderName}
                    onChange={handleNewFolderInputChange}
                    onKeyDown={(e) => handleKeyDown(e, null)}
                    className={styles.input}
                    style={{ width: `${inputWidth}px` }}
                  />
                  <span ref={spanRef} className={styles.hiddenSpan}>
                    {newFolderName}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.options}>
            <div className={styles.btnInfo}>{hoveredButton}</div>
            <div className={styles.toolBar}>
              <button className={`${styles.toolBtn} ${styles["tool-GAN"]}`}
                      onMouseOver={() => handleMouseOver("GAN: Generate your own image")}
                      onMouseOut={handleMouseOut}
                      onClick={onGanClick}>
                <object
                  type="image/svg+xml"
                  data="/assets/images/GAN.svg"
                  style={{ pointerEvents: "none", width: "28px" }}
                >
                  <img src="/assets/images/GAN.svg" alt="GAN" />
                </object>
              </button>
              <button className={`${styles.toolBtn} ${isZoomed ? styles.zoomedBtn : ""}`}
                      onClick={toggleZoom}
                      onMouseOver={() => handleMouseOver("Zoom")}
                      onMouseOut={handleMouseOut}>
                <object
                  type="image/svg+xml"
                  data="/assets/images/zoom.svg"
                  style={{ pointerEvents: "none", width: "22px" }}
                >
                  <img src="/assets/images/zoom.svg" alt="Zoom" />
                </object>
              </button>
              <button className={styles.toolBtn}
                      onClick={handleDownloadSelected}
                      onMouseOver={() => handleMouseOver("Download")}
                      onMouseOut={handleMouseOut}>
                <object
                  type="image/svg+xml"
                  data="/assets/images/down.svg"
                  style={{ pointerEvents: "none", width: "31px" }}
                >
                  <img src="/assets/images/down.svg" alt="Download" />
                </object>
              </button>
              <button className={styles.toolBtn}
                      onClick={() => {
                        setIsEditing(true);
                        setIsCreating(true);
                        setNewFolderName("Untitled Folder");
                      }}
                      onMouseOver={() => handleMouseOver("New folder")}
                      onMouseOut={handleMouseOut}>
                <object
                  type="image/svg+xml"
                  data="/assets/images/newfolder.svg"
                  style={{ pointerEvents: "none", width: "25px", height: "25px" }}
                >
                  <img
                    src="/assets/images/newfolder.svg"
                    alt="Add new folder"
                  />
                </object>
              </button>
              <button className={styles.toolBtn} onClick={handleTrashSelected}
                      onMouseOver={() => handleMouseOver("Delete")}
                      onMouseOut={handleMouseOut}>
                <img src="/assets/images/trashempty.png" alt="Delete" 
                     style={{ pointerEvents: "none", width: "27px", marginLeft: "2px" }}/>
              </button>
              <button className={styles.toolBtn}
                      onMouseOver={() => handleMouseOver("Favorite")}
                      onMouseOut={handleMouseOut}>
                <img
                  src="/assets/images/heart.svg"
                  alt="Favorite Image"
                  className={styles.myfavorite}
                  style={{ pointerEvents: "none", width: "25px" }}
                />
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.divider}>
          <div style={{ backgroundColor: "#ddd" }} className={styles.line} />
          <div style={{ backgroundColor: "#bbb" }} className={styles.line} />
          <div style={{ backgroundColor: "#999" }} className={styles.line} />
          <div style={{ backgroundColor: "#fff" }} className={styles.line} />
        </div>
        
        <div className={styles.gridZone} 
          onDragEnter={handleDragStart}
          onDragLeave={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {fileList && fileList.length > 0 ? (
            imagePaths.map((path, idx) => (
              <div
                key={idx}
                className={`${styles.squareBox} ${
                  isZoomed ? styles.zoomedBox : ""
                }`}
                draggable="true"
                onDragStart={(e) => dragStartHandler(e, fileList[idx].file_id, "file")}
                onClick={() => toggleCheck(idx)}
                onContextMenu={(e) =>
                  handleContextMenu(e, fileList[idx].file_id, "file", fileList[idx].file_name)
                }
              >
                <img
                  src={path}
                  alt={`image ${idx + 1}`}
                  className={styles.squareImage}
                />
                <div
                  className={`${styles.smallBox} ${
                    isZoomed ? styles.zoomedSmall : ""
                  }`}
                >
                  {isChecked[idx] && (
                    <object
                      type="image/svg+xml"
                      data="/assets/images/checkmark.svg"
                      className={styles.check}
                      style={{ pointerEvents: "none" }}
                    >
                      <img src="/assets/images/checkmark.svg" alt="Checkmark" />
                    </object>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>No files in this folder</div>
          )}
        </div>
      </div>
      <ContextMenu contextId={contextMenu.id} contextType={contextMenu.type} />
    </div>
  );
}