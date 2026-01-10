package com.eyepath.project.controller;

import com.eyepath.project.model.Photo;
import com.eyepath.project.repository.PhotoRepository;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoRepository photoRepository;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PhotoController.class);

    @PostMapping("/upload")
    public ResponseEntity<PhotoDto> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            String fileName = file.getOriginalFilename();

            String hash = DigestUtils.sha256Hex(fileBytes);

            Photo photoToReturn;
            Optional<Photo> existingPhoto = photoRepository.findByHash(hash);
            if (existingPhoto.isPresent()) {
                photoToReturn = existingPhoto.get();
            } else {
                Photo photo = Photo.builder()
                        .name(fileName)
                        .photoData(fileBytes)
                        .hash(hash)
                        .build();
                photoToReturn = photoRepository.save(photo);
            }

            PhotoDto response = PhotoDto.builder()
                    .id(photoToReturn.getId())
                    .name(photoToReturn.getName())
                    .base64Data(Base64.getEncoder().encodeToString(photoToReturn.getPhotoData()))
                    .build();

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Integer id) {
        Optional<Photo> photo = photoRepository.findById(id);
        if (photo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(photo.get().getPhotoData());
    }

    @GetMapping
    public List<PhotoDto> getAllPhotos() {
        return photoRepository.findAll().stream()
                .map(p -> new PhotoDto(
                        p.getId(),
                        p.getName(),
                        Base64.getEncoder().encodeToString(p.getPhotoData())))
                .toList();
    }
}
