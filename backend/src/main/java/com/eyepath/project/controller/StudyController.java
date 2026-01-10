package com.eyepath.project.controller;

import com.eyepath.project.model.Photo;
import com.eyepath.project.model.StudyInfo;
import com.eyepath.project.model.StudyPhoto;
import com.eyepath.project.repository.PhotoRepository;
import com.eyepath.project.repository.StudyPhotoRepository;
import com.eyepath.project.repository.StudyRepository;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
@Slf4j
public class StudyController {

    private final StudyRepository testRepository;
    private final PhotoRepository photoRepository;
    private final StudyPhotoRepository testPhotoRepository;

    @PostConstruct
    void init() {
        ClassPathResource resource = new ClassPathResource("eyeLogo.png");
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] imageBytes = inputStream.readAllBytes();
            String hash = DigestUtils.sha256Hex(imageBytes);
            Photo photo = Photo.builder()
                    .name("f1")
                    .hash(hash)
                    .photoData(imageBytes)
                    .build();

            Optional<Photo> existing = photoRepository.findByHash(hash);
            if (existing.isEmpty()) {
                photoRepository.save(photo);
            }
        } catch (IOException e) {
            log.error("Failed to initialize default photo (eyeLogo.png): {}", e.getMessage(), e);
        }
    }

    @GetMapping("/photos")
    public List<PhotoDto> getAllPhotos() {
        return photoRepository.findAll().stream()
                .map(photo -> new PhotoDto(
                        photo.getId(),
                        photo.getName(),
                        photo.getPhotoData() != null
                                ? Base64.getEncoder()
                                        .encodeToString(photo.getPhotoData())
                                : null))
                .toList();
    }

    @GetMapping
    public ResponseEntity<List<StudyDtoResponse>> getAllStudies() {
        List<StudyInfo> tests = testRepository.findAll();

        List<StudyDtoResponse> response = tests.stream()
                .map(test -> {
                    List<PhotoDto> photos = testPhotoRepository.findByStudyOrderByPhotoOrder(test)
                            .stream()
                            .map(tp -> new PhotoDto(
                                    tp.getPhoto().getId(),
                                    tp.getPhoto().getName(),
                                    null))
                            .toList();

                    return new StudyDtoResponse(
                            test.getId(),
                            test.getName(),
                            photos);
                })
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyDtoResponse> getTestWithPhotos(@PathVariable Integer id) {
        StudyInfo test = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found with id " + id));

        List<StudyPhoto> testPhotos = testPhotoRepository.findByStudyOrderByPhotoOrder(test);

        List<PhotoDto> photoDtos = testPhotos.stream()
                .map(tp -> new PhotoDto(
                        tp.getPhoto().getId(),
                        tp.getPhoto().getName(),
                        tp.getPhoto().getPhotoData() != null
                                ? Base64.getEncoder().encodeToString(
                                        tp.getPhoto().getPhotoData())
                                : null))
                .toList();

        StudyDtoResponse response = new StudyDtoResponse(
                test.getId(),
                test.getName(),
                photoDtos);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public StudyInfo createTest(@RequestBody StudyDto dto) {
        log.info("Received createTest request: {}", dto);
        StudyInfo test = StudyInfo.builder()
                .name(dto.getName())
                .build();
        test = testRepository.save(test);
        log.info("Created Test: id={}, name={}", test.getId(), test.getName());

        for (int i = 0; i < dto.getPhotoIds().size(); i++) {
            Integer photoId = dto.getPhotoIds().get(i);
            Photo photo = photoRepository.findById(photoId)
                    .orElseThrow(() -> new RuntimeException("Photo not found with id " + photoId));
            StudyPhoto tp = StudyPhoto.builder()
                    .study(test)
                    .photo(photo)
                    .photoOrder(i)
                    .build();
            testPhotoRepository.save(tp);
            log.info("Linked Photo id={} to Test id={} at order {}", photoId, test.getId(), i);
        }
        log.info("Finished creating Test with {} photos", dto.getPhotoIds().size());
        return test;
    }
}
