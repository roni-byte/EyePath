package com.eyepath.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "client_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientResult {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Integer id;

    @Column(name = "name")
    private String name;

    @Builder.Default
    @Column(name = "at_date", nullable = false)
    private LocalDateTime atDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "study_id")
    private StudyInfo study;
}
