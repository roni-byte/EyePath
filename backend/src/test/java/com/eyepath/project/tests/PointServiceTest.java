package com.eyepath.project.tests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.eyepath.project.controller.PointDto;
import com.eyepath.project.controller.PointService;
import com.eyepath.project.model.ClientResult;
import com.eyepath.project.model.Photo;
import com.eyepath.project.model.Point;
import com.eyepath.project.repository.PointRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {

    @Mock
    private PointRepository pointRepository;

    @InjectMocks
    private PointService pointService;

    @Test
    void mapToDto_ShouldMapFieldsCorrectly() {
        ClientResult dummyResult = ClientResult.builder().id(10).build();
        Photo dummyPhoto = Photo.builder().id(20).build();

        Point point = Point.builder()
                .resultId(dummyResult)
                .photoId(dummyPhoto)
                .timestamp(12345)
                .positionX(100.5f)
                .positionY(200.5f)
                .isOutside(true)
                .build();

        PointDto dto = pointService.mapToDto(point);

        assertEquals(10, dto.getResultId());
        assertEquals(20, dto.getPhotoId());
        assertEquals(12345, dto.getTimestamp());
        assertEquals(100.5f, dto.getPositionX());
        assertEquals(true, dto.isOutside());
    }

    @Test
    void getPointsByResultId_ShouldReturnMappedList() {
        Integer resultId = 1;
        ClientResult dummyResult = ClientResult.builder().id(resultId).build();
        Photo dummyPhoto = Photo.builder().id(5).build();
        
        Point point = Point.builder()
                .resultId(dummyResult)
                .photoId(dummyPhoto)
                .build();

        when(pointRepository.findByResultId_Id(resultId)).thenReturn(List.of(point));

        List<PointDto> result = pointService.getPointsByResultId(resultId);

        assertEquals(1, result.size());
        verify(pointRepository).findByResultId_Id(resultId);
    }
}