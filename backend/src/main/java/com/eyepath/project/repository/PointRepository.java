package com.eyepath.project.repository;

import com.eyepath.project.model.Point;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointRepository extends JpaRepository<Point, Integer> {
    List<Point> findByResultId_Id(Integer resultId);
}
