package com.eyepath.project.controller;

import com.eyepath.project.model.ClientResult;
import com.eyepath.project.model.StudyInfo;
import com.eyepath.project.repository.ClientResultRepository;
import com.eyepath.project.repository.StudyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/result")
@RequiredArgsConstructor
@Slf4j
public class ClientResultController {
    private final ClientResultRepository clientResultRepository;
    private final StudyRepository studyRepository;
    private final PointService pointService;

    @PostMapping("/create")
    public ResponseEntity<ClientResult> saveClientResult(@RequestBody ClientResultDto dto) {
        try {
            if (dto.getName() == null || dto.getName().isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            StudyInfo study = null;
            if (dto.getTestId() != null) {
                study = studyRepository.findById(dto.getTestId()).orElse(null);
            }

            ClientResult result = ClientResult.builder()
                    .name(dto.getName())
                    .study(study)
                    .build();

            result = clientResultRepository.save(result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<ClientResult>> getResultsByTestId(@PathVariable Integer testId) {
        return ResponseEntity.ok(clientResultRepository.findByStudy_Id(testId));
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<List<PointDto>> getPointsByResultId(@PathVariable Integer id) {

        return ResponseEntity.ok(pointService.getPointsByResultId(id));
    }
}
