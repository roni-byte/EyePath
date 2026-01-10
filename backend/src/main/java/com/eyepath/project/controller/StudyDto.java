package com.eyepath.project.controller;

import java.util.List;
import lombok.Data;

@Data
public class StudyDto {
    private String name;
    private List<Integer> photoIds;
}
