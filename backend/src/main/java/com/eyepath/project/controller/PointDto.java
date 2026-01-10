package com.eyepath.project.controller;

import lombok.Data;

@Data
public class PointDto {
    private Integer resultId;
    private Integer photoId;
    private Integer timestamp;
    private float positionX;
    private float positionY;
    private boolean isOutside;
}
