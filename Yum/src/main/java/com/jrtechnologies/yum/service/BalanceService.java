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
package com.jrtechnologies.yum.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import javax.transaction.Transactional;
import com.jrtechnologies.yum.api.ApiException;
import com.jrtechnologies.yum.api.BalanceSseApiController;
import com.jrtechnologies.yum.api.ConcurrentModificationException;
import com.jrtechnologies.yum.api.model.Deposit;
import com.jrtechnologies.yum.data.entity.Transaction;
import com.jrtechnologies.yum.data.entity.User;
import com.jrtechnologies.yum.data.repository.UserRepository;
import com.jrtechnologies.yum.data.repository.TransactionRepository;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class BalanceService {

    @Autowired
    private UserRepository userRep;

    @Autowired
    private TransactionRepository transactionRep;

    public BigDecimal balanceIdGet(Long id) throws ApiException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        //Retrieve user roles
        ArrayList<String> roles = (ArrayList) authentication.getCredentials();

        //If user is not admin AND token id is different than id in path  
        if (!roles.contains("admin") && ((Long) authentication.getPrincipal()) != id) {
            throw new ApiException(400, "Bad request");
        }

        User user = userRep.findById(id);
        if (user == null) {
            throw new ApiException(404, "User not found");
        }
        BigDecimal balance = user.getBalance();
        if (balance == null) {
            balance = new BigDecimal(0);
        }
        return balance;
    }

    @Transactional
    public BigDecimal balanceIdPut(Long id, Deposit deposit) throws ApiException {

        BigDecimal amount = deposit.getAmount();
        if (id == null || amount == null) {
            throw new ApiException(400, "Bad request");
        }
        User user = userRep.findById(id);
        if (user == null) {
            throw new ApiException(404, "User not found");
        }
        // If balance is already modified return the new balance
        BigDecimal balance = user.getBalance();
        if (balance == null) {
            balance = new BigDecimal(0);
        }
        if (balance.compareTo(deposit.getBalance()) != 0) {
            throw new ConcurrentModificationException(409, "Concurrent modification error.", balance);
        }
        Transaction transaction = new Transaction();
        transaction.setUserId(id);
        transaction.setAmount(amount);

        balance = balance.add(amount);
        transaction.setBalance(balance);
        user.setBalance(balance);

        //Retrieves source user id form token
        transaction.setSourceId((Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        transactionRep.save(transaction);
        BalanceSseApiController.sendSseEventsToUI(id, balance);
        return balance;
    }

}
