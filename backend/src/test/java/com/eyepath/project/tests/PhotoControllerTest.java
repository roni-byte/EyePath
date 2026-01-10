package com.eyepath.project.tests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.eyepath.project.model.Photo;
import com.eyepath.project.repository.PhotoRepository;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PhotoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PhotoRepository photoRepository;

    private Photo photo1;
    private Photo photo2;

    @BeforeEach
    void setup() {
        photoRepository.deleteAll();

        byte[] bytes1 = new byte[] { 1, 2, 3 };
        byte[] bytes2 = new byte[] { 4, 5, 6 };

        photo1 = Photo.builder()
                .name("Photo1")
                .hash(DigestUtils.sha256Hex(bytes1))
                .photoData(bytes1)
                .uploadedAt(LocalDateTime.now())
                .build();

        photo2 = Photo.builder()
                .name("Photo2")
                .hash(DigestUtils.sha256Hex(bytes2))
                .photoData(bytes2)
                .uploadedAt(LocalDateTime.now())
                .build();

        photoRepository.save(photo1);
        photoRepository.save(photo2);
    }

    @Test
    void getAllPhotos_returnsAllPhotos() throws Exception {
        mockMvc.perform(get("/api/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Photo1"))
                .andExpect(jsonPath("$[1].name").value("Photo2"));
    }

    @Test
    void getAllPhotos_returnsEmptyList_whenNoPhotosExist() throws Exception {
        photoRepository.deleteAll();

        mockMvc.perform(get("/api/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getPhoto_returnsPhotoBytes_whenExists() throws Exception {
        mockMvc.perform(get("/api/photos/" + photo1.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(photo1.getPhotoData()));
    }

    @Test
    void getPhoto_returnsNotFound_whenPhotoDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/photos/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void uploadPhoto_savesNewPhoto_whenNotDuplicate() throws Exception {
        byte[] fileBytes = new byte[] { 9, 9, 9 };
        MockMultipartFile mockFile = new MockMultipartFile("file", "test.png", "image/png", fileBytes);

        mockMvc.perform(multipart("/api/photos/upload").file(mockFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("test.png"));

        assertThat(photoRepository.findAll()).hasSize(3);
    }

    @Test
    void uploadPhoto_returnsExistingPhoto_whenDuplicateHash() throws Exception {
        byte[] fileBytes = new byte[] { 1, 2, 3 };
        MockMultipartFile mockFile = new MockMultipartFile("file", "duplicate.png", "image/png", fileBytes);

        mockMvc.perform(multipart("/api/photos/upload").file(mockFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Photo1"))
                .andExpect(jsonPath("$.base64Data").value(Base64.getEncoder().encodeToString(fileBytes)));

        assertThat(photoRepository.findAll()).hasSize(2);
    }

    @Test
    void uploadPhoto_handlesIOExceptionGracefully() throws Exception {
        MockMultipartFile badFile = new MockMultipartFile("file", "bad.png", "image/png", new byte[0]);

        mockMvc.perform(multipart("/api/photos/upload").file(badFile))
                .andExpect(status().isOk());
    }

    @Test
    void uploadPhoto_ShouldReturnInternalServerError_WhenIOExceptionOccurs()
            throws Exception {
        MockMultipartFile crashingFile = new MockMultipartFile(
                "file", "test.png", "image/png", "test data".getBytes()) {
            @Override
            public byte[] getBytes() throws IOException {
                throw new IOException("Simulated disk error");
            }
        };

        mockMvc.perform(multipart("/api/photos/upload").file(crashingFile))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(""));
    }

}
