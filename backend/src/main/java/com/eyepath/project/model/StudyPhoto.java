package com.eyepath.project.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "study_photos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Integer id;

    @ManyToOne()
    @JoinColumn(name = "study_id")
    @JsonIgnore
    private StudyInfo study;

    @ManyToOne()
    @JoinColumn(name = "photo_id")
    private Photo photo;

    @Column(name = "photo_order")
    private Integer photoOrder;
}
