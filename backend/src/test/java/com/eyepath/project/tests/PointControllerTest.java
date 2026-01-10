package com.eyepath.project.tests;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.eyepath.project.model.ClientResult;
import com.eyepath.project.model.Photo;
import com.eyepath.project.model.Point;
import com.eyepath.project.model.StudyInfo;
import com.eyepath.project.repository.ClientResultRepository;
import com.eyepath.project.repository.PhotoRepository;
import com.eyepath.project.repository.PointRepository;
import com.eyepath.project.repository.StudyRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class PointControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PointRepository pointRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private ClientResultRepository clientResultRepository;

    @Autowired
    private StudyRepository studyRepository;

    private ClientResult savedResult;
    private Photo savedPhoto;

    @BeforeEach
    void setup() {
        pointRepository.deleteAll();
        clientResultRepository.deleteAll();
        studyRepository.deleteAll();
        photoRepository.deleteAll();

        savedResult = clientResultRepository.save(
                ClientResult.builder()
                        .name("Result1")
                        .build());

        savedPhoto = photoRepository.save(
                Photo.builder()
                        .name("PhotoTest")
                        .hash(DigestUtils.sha256Hex(new byte[] { 1, 2, 3 }))
                        .photoData(new byte[] { 1, 2, 3 })
                        .uploadedAt(LocalDateTime.now())
                        .build());
    }

    @Test
    void savePoint_createsPointCorrectly() throws Exception {
        String payload = "{ \"resultId\": " + savedResult.getId() + ","
                + "  \"photoId\": " + savedPhoto.getId() + ","
                + "  \"timestamp\": 12345,"
                + "  \"positionX\": 1.5,"
                + "  \"positionY\": -1.3,"
                + "  \"outside\": true }";

        mockMvc.perform(post("/api/point/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timestamp").value(12345))
                .andExpect(jsonPath("$.positionX").value(1.5))
                .andExpect(jsonPath("$.positionY").value(-1.3))
                .andExpect(jsonPath("$.outside").value(true));

        List<Point> points = pointRepository.findAll();
        assertEquals(1, points.size());
        assertEquals(savedResult.getId(), points.get(0).getResultId().getId());
        assertEquals(savedPhoto.getId(), points.get(0).getPhotoId().getId());
    }

    @Test
    void savePointsBatch_savesMultiplePoints() throws Exception {
        Photo photo2 = photoRepository.save(Photo.builder()
                .name("Photo2")
                .hash("hash2")
                .uploadedAt(LocalDateTime.now())
                .build());

        String payload = "[ " +
                "{ \"resultId\": " + savedResult.getId() + ", \"photoId\": " + savedPhoto.getId() + ", \"timestamp\": 100, \"positionX\": 10.0, \"positionY\": 10.0, \"outside\": false }," +
                "{ \"resultId\": " + savedResult.getId() + ", \"photoId\": " + photo2.getId() + ", \"timestamp\": 200, \"positionX\": 20.0, \"positionY\": 20.0, \"outside\": true }" +
                "]";

        mockMvc.perform(post("/api/point/save/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));

        List<Point> points = pointRepository.findAll();
        assertEquals(2, points.size());
    }

    @Test
    void savePointsBatch_emptyList_returnsOk() throws Exception {
        mockMvc.perform(post("/api/point/save/batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content("[]"))
                .andExpect(status().isOk());
    }

    @Test
    void getPointsByTestId_returnsPointsFromAllResultsInStudy() throws Exception {
        StudyInfo study = studyRepository.save(StudyInfo.builder().name("My Study").build());

        savedResult.setStudy(study);
        clientResultRepository.save(savedResult);

        ClientResult res2 = clientResultRepository.save(ClientResult.builder().name("Res2").study(study).build());

        pointRepository.save(Point.builder().resultId(savedResult).photoId(savedPhoto).timestamp(10).build());
        pointRepository.save(Point.builder().resultId(res2).photoId(savedPhoto).timestamp(20).build());

        mockMvc.perform(get("/api/point/test/" + study.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void savePoint_invalidResultId_returnsError() throws Exception {
        String payload = "{ \"resultId\": 9999,"
                + "  \"photoId\": " + savedPhoto.getId() + ","
                + "  \"timestamp\": 12345 }";

        try {
            mockMvc.perform(post("/api/point/save")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload))
                    .andExpect(status().is5xxServerError());
        } catch (Exception e) {
            assertNotNull(e.getCause());
            assertTrue(e.getCause().getMessage().contains("Result not found"));
        }
    }

    @Test
    void savePoint_invalidPhotoId_returnsError() throws Exception {
        String payload = "{ \"resultId\": " + savedResult.getId() + ","
                + "  \"photoId\": 9999,"
                + "  \"timestamp\": 100 }";

        try {
            mockMvc.perform(post("/api/point/save")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload))
                    .andExpect(status().is5xxServerError());
        } catch (Exception e) {
            assertNotNull(e.getCause());
            assertTrue(e.getCause().getMessage().contains("Photo not found"));
        }
    }
}
