package com.eyepath.project.controller;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudyDtoResponse {
    private Integer id;
    private String name;
    private List<PhotoDto> photos;
}
