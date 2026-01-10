package com.eyepath.project.tests;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.eyepath.project.model.Photo;
import com.eyepath.project.model.StudyInfo;
import com.eyepath.project.model.StudyPhoto;
import com.eyepath.project.repository.PhotoRepository;
import com.eyepath.project.repository.StudyPhotoRepository;
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
class StudyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private StudyRepository studyRepository;

    @Autowired
    private StudyPhotoRepository studyPhotoRepository;

    private Photo photo1;
    private Photo photo2;

    @BeforeEach
    void setup() {
        studyPhotoRepository.deleteAll();
        studyRepository.deleteAll();
        photoRepository.deleteAll();

        byte[] bytes1 = new byte[] { 1, 2, 3 };
        byte[] bytes2 = new byte[] { 4, 5, 6 };

        photo1 = Photo.builder()
                .name("Photo1")
                .hash(DigestUtils.sha256Hex(bytes1))
                .photoData(new byte[] { 1, 2, 3 })
                .uploadedAt(LocalDateTime.now())
                .build();

        photo2 = Photo.builder()
                .name("Photo2")
                .hash(DigestUtils.sha256Hex(bytes2))
                .photoData(new byte[] { 4, 5, 6 })
                .uploadedAt(LocalDateTime.now())
                .build();

        photoRepository.save(photo1);
        photoRepository.save(photo2);
    }

    @Test
    void getAllPhotos_returnsAllPhotos() throws Exception {
        mockMvc.perform(get("/api/tests/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Photo1"))
                .andExpect(jsonPath("$[1].name").value("Photo2"));
    }

    @Test
    void getAllPhotos_returnsEmpty_whenNoPhotosExist() throws Exception {
        photoRepository.deleteAll();

        mockMvc.perform(get("/api/tests/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createStudy_createsStudyWithPhotos() throws Exception {
        String payload = "{ \"name\": \"Test1\", \"photoIds\": [" + photo1.getId() + "," + photo2.getId()
                + "] }";

        mockMvc.perform(post("/api/tests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test1"));

        StudyInfo savedTest = studyRepository.findAll().get(0);
        assertEquals("Test1", savedTest.getName());
        List<StudyPhoto> linkedPhotos = studyPhotoRepository.findByStudyOrderByPhotoOrder(savedTest);
        assertEquals(2, linkedPhotos.size());
    }

    @Test
    void createStudy_invalidPhotoIds_handlesExceptionGracefully() throws Exception {
        String payload = "{ \"name\": \"InvalidTest\", \"photoIds\": [999] }";

        try {
            mockMvc.perform(post("/api/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(payload))
                    .andExpect(status().is5xxServerError());
        } catch (Exception e) {
            assertNotNull(e.getCause());
            assertTrue(e.getCause().getMessage().contains("Photo not found with id 999"));
        }
    }

    @Test
    void getAllStudys_returnsCreatedStudys() throws Exception {
        StudyInfo t = studyRepository.save(StudyInfo.builder().name("DBTest").build());

        mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(t.getId()))
                .andExpect(jsonPath("$[0].name").value("DBTest"));
    }

    @Test
    void getStudysWithPhotos_returnsCorrectData() throws Exception {
        StudyInfo t = studyRepository.save(StudyInfo.builder().name("SingleTest").build());
        studyPhotoRepository.save(StudyPhoto.builder().study(t).photo(photo1).photoOrder(0).build());

        mockMvc.perform(get("/api/tests/" + t.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("SingleTest"))
                .andExpect(jsonPath("$.photos[0].id").value(photo1.getId()));
    }
}
