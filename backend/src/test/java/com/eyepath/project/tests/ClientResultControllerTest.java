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
class ClientResultControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientResultRepository clientResultRepository;

    @Autowired
    private PointRepository pointRepository;

    @Autowired
    private StudyRepository studyRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @BeforeEach
    void setup() {
        pointRepository.deleteAll();
        clientResultRepository.deleteAll();
        studyRepository.deleteAll();
        photoRepository.deleteAll();
    }

    @Test
    void createClientResult_savesCorrectly() throws Exception {
        String payload = "{ \"name\":\"John Doe\" }";

        mockMvc.perform(post("/api/result/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Doe"));

        List<ClientResult> all = clientResultRepository.findAll();
        assertEquals(1, all.size());
        assertEquals("John Doe", all.get(0).getName());
    }

    @Test
    void createClientResult_missingName_returnsBadRequest() throws Exception {
        String payload = "{ }";

        mockMvc.perform(post("/api/result/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createClientResult_savedRecordHasDate() throws Exception {
        String payload = "{ \"name\":\"TestUser\" }";

        mockMvc.perform(post("/api/result/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());

        ClientResult saved = clientResultRepository.findAll().get(0);

        assertNotNull(saved.getAtDate());
        assertTrue(saved.getAtDate().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    void getResultsByTestId_returnsList() throws Exception {
        StudyInfo study = new StudyInfo();
        study.setName("Test Study Name");
        study = studyRepository.save(study);
        Integer testId = study.getId();

        ClientResult res = ClientResult.builder()
                .name("Test Result")
                .study(study)
                .build();
        clientResultRepository.save(res);

        mockMvc.perform(get("/api/result/test/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Result"))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getPointsByResultId_returnsMappedDtos() throws Exception {
        Photo photo = Photo.builder()
                .hash("unique-hash-123")
                .name("test-photo.png")
                .build();
        photo = photoRepository.save(photo);
        ClientResult res = clientResultRepository.save(ClientResult.builder().name("Res").build());

        Point p = Point.builder()
                .resultId(res)
                .photoId(photo)
                .positionX(10)
                .positionY(20)
                .isOutside(false)
                .build();
        pointRepository.save(p);

        mockMvc.perform(get("/api/result/" + res.getId() + "/points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].positionX").value(10))
                .andExpect(jsonPath("$[0].photoId").value(photo.getId()))
                .andExpect(jsonPath("$[0].resultId").value(res.getId()));
    }

    @Test
    void createClientResult_withInvalidTestId_setsStudyToNull() throws Exception {
        String payload = "{ \"name\":\"User\", \"testId\": 999 }";

        mockMvc.perform(post("/api/result/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.study").isEmpty());
    }
}
