package com.eyepath.project.controller;

import com.eyepath.project.model.Point;
import com.eyepath.project.repository.PointRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointService {
    private final PointRepository pointRepository;

    public PointDto mapToDto(Point p) {
        PointDto dto = new PointDto();
        dto.setResultId(p.getResultId().getId());
        dto.setPhotoId(p.getPhotoId().getId());
        dto.setTimestamp(p.getTimestamp());
        dto.setPositionX(p.getPositionX());
        dto.setPositionY(p.getPositionY());
        dto.setOutside(p.isOutside());
        return dto;
    }

    public List<PointDto> getPointsByResultId(Integer id) {
        return pointRepository.findByResultId_Id(id).stream()
                .map(this::mapToDto)
                .toList();
    }
}