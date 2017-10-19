/*
 * Copyright (C) 2017 JR Technologies.
 * This file is part of Yum.
 * 
 * Yum is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * 
 * Yum is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with Yum. 
 * If not, see <http://www.gnu.org/licenses/>.
 */
package com.jrtechnologies.yum.api;

import java.math.BigDecimal;
import com.jrtechnologies.yum.api.model.Deposit;
import com.jrtechnologies.yum.api.model.Error;
import com.jrtechnologies.yum.data.repository.UserRepository;

import io.swagger.annotations.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import javax.validation.constraints.*;
import javax.validation.Valid;
import com.jrtechnologies.yum.service.BalanceService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import static org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event;
@javax.annotation.Generated(value = "io.swagger.codegen.languages.SpringCodegen", date = "2017-09-26T10:52:56.671+03:00")

@Controller
@RequestMapping(value="/api")
public class BalanceSseApiController  {

    
    private static final Map<SecurityContext, SseEmitter> emitters = new HashMap<>();
    
    @Autowired
    UserRepository userRepository;
    
    @RequestMapping(value = "/balanceSse",
        produces = { "text/event-stream" }, 
        method = RequestMethod.GET)
    @CrossOrigin
    @PreAuthorize("hasAuthority('hungry')")
    public SseEmitter balanceSseGet() {
        
        SseEmitter emitter; // = new SseEmitter();
        //Long id = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        SecurityContext securityContext = SecurityContextHolder.getContext();
        //List<SseEmitter> userEmitters;
        if (!emitters.containsKey(securityContext)){
           // userEmitters= new ArrayList<>();   
            emitter = new SseEmitter();
            emitters.put(securityContext, emitter);
        } else {
            emitter = emitters.get(securityContext);  
        }
       // userEmitters.add(emitter); 
        System.out.println(">>>>>>emitter added: " + emitters);
        emitter.onCompletion(() -> emitters.remove(securityContext));
//        try {          
//            emitter.send(userRepository.findOne(id).getBalance(), MediaType.APPLICATION_JSON);
//        } catch (IOException ex) {
//            emitter.complete();
//            emitters.remove(id);
//        }
        return emitter;
        
   
    }
    
    public static void sendSseEventsToUI(Long id, BigDecimal balance){
       // List<SseEmitter> userEmitters = emitters.get(id);
        //System.out.println(">>>>>>>>>useremi: " + userEmitters);
        Map<Integer, Integer> map = new HashMap<Integer, Integer>();
//for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
//    System.out.println("Key = " + entry.getKey() + ", Value = " + entry.getValue());
//}
        for (Map.Entry<SecurityContext, SseEmitter> emitterEntry: emitters.entrySet()){
            try {
                if ((Long) emitterEntry.getKey().getAuthentication().getPrincipal() == id) {
                //emitter.send(balance, MediaType.APPLICATION_JSON);
                    System.out.println(">>>>>>>>>>>>>>>>>>>>sent");
                    emitterEntry.getValue().send(event().data(balance, MediaType.APPLICATION_JSON));
                }
            } catch (IOException e) {
                emitterEntry.getValue().complete();
                emitters.remove(emitterEntry.getKey());    
                e.printStackTrace();
            }  
        }
    }
}
