package com.eyepath.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "result_points")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Point {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Integer id;

    @ManyToOne()
    @JoinColumn(name = "result_id")
    private ClientResult resultId;

    @ManyToOne()
    @JoinColumn(name = "photo_id")
    private Photo photoId;

    @Column(name = "timestamp_ms")
    private Integer timestamp;

    @Column(name = "position_x")
    private float positionX;

    @Column(name = "position_y")
    private float positionY;

    @Column(name = "is_outside")
    private boolean isOutside;
}
