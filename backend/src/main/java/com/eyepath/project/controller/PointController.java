package com.eyepath.project.controller;

import com.eyepath.project.model.ClientResult;
import com.eyepath.project.model.Photo;
import com.eyepath.project.model.Point;
import com.eyepath.project.repository.ClientResultRepository;
import com.eyepath.project.repository.PhotoRepository;
import com.eyepath.project.repository.PointRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/point")
@RequiredArgsConstructor
public class PointController {
    private final PointRepository pointRepository;
    private final PhotoRepository photoRepository;
    private final PointService pointService;
    private final ClientResultRepository clientResultRepository;

    @PostMapping("/save")
    public ResponseEntity<Point> savePoint(@RequestBody PointDto dto) {
        ClientResult resultId = clientResultRepository
                .findById(dto.getResultId())
                .orElseThrow(() -> new RuntimeException("Result not found"));

        Photo photoId = photoRepository
                .findById(dto.getPhotoId())
                .orElseThrow(() -> new RuntimeException("Photo not found"));

        Point point = Point.builder()
                .resultId(resultId)
                .photoId(photoId)
                .timestamp(dto.getTimestamp())
                .positionX(dto.getPositionX())
                .positionY(dto.getPositionY())
                .isOutside(dto.isOutside())
                .build();

        point = pointRepository.save(point);
        return ResponseEntity.ok(point);
    }

    @PostMapping("/save/batch")
    public ResponseEntity<Integer> savePointsBatch(@RequestBody List<PointDto> dtos) {
        if (dtos.isEmpty()) {
            return ResponseEntity.ok().build();
        }

        ClientResult result = clientResultRepository
                .findById(dtos.get(0).getResultId())
                .orElseThrow(() -> new RuntimeException("Result not found"));

        Set<Integer> uniquePhotoIds = dtos.stream()
                .map(PointDto::getPhotoId)
                .collect(Collectors.toSet());

        Map<Integer, Photo> photosMap = photoRepository.findAllById(uniquePhotoIds).stream()
                .collect(Collectors.toMap(Photo::getId, Function.identity()));

        List<Point> pointsToSave = new ArrayList<>();

        for (PointDto dto : dtos) {
            Photo photo = photosMap.get(dto.getPhotoId());

            if (photo != null) {
                pointsToSave.add(Point.builder()
                        .resultId(result)
                        .photoId(photo)
                        .timestamp(dto.getTimestamp())
                        .positionX(dto.getPositionX())
                        .positionY(dto.getPositionY())
                        .isOutside(dto.isOutside())
                        .build());
            }
        }

        pointRepository.saveAll(pointsToSave);
        return ResponseEntity.ok(pointsToSave.size());
    }

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<PointDto>> getPointsByTestId(@PathVariable Integer testId) {
        List<ClientResult> results = clientResultRepository.findByStudy_Id(testId);

        List<PointDto> allPoints = results.stream()
                .flatMap(res -> pointService.getPointsByResultId(res.getId()).stream())
                .toList();

        return ResponseEntity.ok(allPoints);
    }
}
